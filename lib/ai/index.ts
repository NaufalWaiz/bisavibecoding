/**
 * Satu pintu untuk semua interaksi LLM.
 *
 * Integrasi LimitRouter HANYA hidup di file ini (+ `models.ts`). Route handler
 * dan komponen tidak pernah tahu provider apa yang dipakai — mereka hanya
 * bicara dalam `tier` (`'default' | 'premium'`). Kalau nanti gateway diganti,
 * cukup ubah file ini.
 */
import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import {
  generateObject,
  generateText,
  streamText as aiStreamText,
  type LanguageModelUsage,
  type ModelMessage,
} from "ai";
import type { z } from "zod";
import { serverEnv } from "@/lib/env";
import { resolveModel, type ModelTier } from "./models";
import { STREAM_ERROR_MARKER } from "./stream-error";

export type { ModelTier } from "./models";

/**
 * Klien LimitRouter (OpenAI-compatible). Dibuat lazy + di-cache agar env hanya
 * dibaca saat benar-benar dipakai, bukan saat modul diimpor.
 */
let cachedProvider: ReturnType<typeof createOpenAI> | null = null;

function limitRouter() {
  if (!cachedProvider) {
    cachedProvider = createOpenAI({
      apiKey: serverEnv.limitRouterApiKey(),
      baseURL: serverEnv.limitRouterBaseUrl(),
      name: "limitrouter",
    });
  }
  return cachedProvider;
}

/** Ambil model LimitRouter untuk `tier`. Internal — jangan diekspor keluar lib/ai. */
function modelFor(tier: ModelTier) {
  return limitRouter().chat(resolveModel(tier));
}

/** Ringkasan pemakaian token untuk dicatat ke tabel `generations`. */
export type UsageReport = {
  model: string;
  promptTokens: number;
  completionTokens: number;
};

function toUsageReport(
  tier: ModelTier,
  usage: LanguageModelUsage | undefined,
): UsageReport {
  return {
    model: resolveModel(tier),
    promptTokens: usage?.inputTokens ?? 0,
    completionTokens: usage?.outputTokens ?? 0,
  };
}

export type StreamOptions = {
  system: string;
  prompt?: string;
  messages?: ModelMessage[];
  tier?: ModelTier;
  temperature?: number;
  maxOutputTokens?: number;
  /** Dipanggil setelah stream selesai — dipakai untuk mencatat biaya. */
  onUsage?: (usage: UsageReport) => void | Promise<void>;
};

/**
 * Terjemahkan error dari gateway menjadi kalimat yang bisa ditindaklanjuti.
 *
 * Gateway mengembalikan alasan yang spesifik (slug tidak ada, kredit kurang);
 * pesan itu jauh lebih berguna daripada "generasi gagal", jadi diteruskan.
 */
export function describeAiError(error: unknown): string {
  const visited = new Set<unknown>();

  function dig(current: unknown): string | null {
    if (!current || typeof current !== "object" || visited.has(current)) return null;
    visited.add(current);

    const candidate = current as {
      responseBody?: unknown;
      message?: unknown;
      lastError?: unknown;
      cause?: unknown;
      errors?: unknown;
    };

    if (typeof candidate.responseBody === "string" && candidate.responseBody) {
      try {
        const parsed = JSON.parse(candidate.responseBody) as {
          error?: { message?: string };
        };
        if (parsed.error?.message) return parsed.error.message;
      } catch {
        // Body bukan JSON — pakai apa adanya di bawah.
      }
    }

    if (typeof candidate.message === "string") {
      if (candidate.message.includes("ENOTFOUND")) {
        return `Host gateway LLM tidak ditemukan. Periksa LIMITROUTER_BASE_URL (${candidate.message}).`;
      }
      if (/ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(candidate.message)) {
        return `Gateway LLM tidak bisa dihubungi: ${candidate.message}`;
      }
    }

    return (
      dig(candidate.lastError) ??
      dig(candidate.cause) ??
      (Array.isArray(candidate.errors)
        ? candidate.errors.map(dig).find(Boolean) ?? null
        : null) ??
      (typeof candidate.message === "string" ? candidate.message : null)
    );
  }

  return dig(error) ?? "Generasi gagal karena alasan yang tidak dikenali.";
}

/**
 * Streaming teks bebas (mis. pertanyaan klarifikasi, PRD markdown).
 * Mengembalikan `Response` berisi `text/plain` stream — route tinggal
 * meneruskannya ke client.
 *
 * Stream dirakit manual (bukan `toTextStreamResponse()`) supaya kegagalan yang
 * terjadi SETELAH header terkirim tetap sampai ke client sebagai pesan, bukan
 * sebagai respons kosong.
 */
export function streamText(options: StreamOptions): Response {
  const tier = options.tier ?? "default";

  // PENTING: AI SDK tidak melempar error ke `textStream` — stream hanya berakhir
  // kosong dan alasannya dikirim ke `onError`. Tanpa menangkapnya di sini,
  // kegagalan apa pun tampak seperti balasan kosong di layar user.
  let streamFailure: unknown = null;

  const result = aiStreamText({
    model: modelFor(tier),
    system: options.system,
    ...(options.messages
      ? { messages: options.messages }
      : { prompt: options.prompt ?? "" }),
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens ?? 4000,
    onError: ({ error }) => {
      streamFailure = error;
    },
    onFinish: async ({ totalUsage }) => {
      await options.onUsage?.(toUsageReport(tier, totalUsage));
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let emitted = 0;
      try {
        for await (const chunk of result.textStream) {
          emitted += chunk.length;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        streamFailure ??= error;
      }

      // Stream kosong tanpa error tercatat tetap dianggap gagal: user tidak
      // boleh ditinggalkan dengan layar kosong tanpa penjelasan.
      if (streamFailure || emitted === 0) {
        const reason = streamFailure
          ? describeAiError(streamFailure)
          : "Gateway LLM tidak mengembalikan teks apa pun.";
        console.error(`[ai] stream gagal (tier=${tier}):`, reason);
        controller.enqueue(encoder.encode(`${STREAM_ERROR_MARKER}${reason}`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

export type JsonOptions = {
  system: string;
  prompt: string;
  tier?: ModelTier;
  temperature?: number;
  maxOutputTokens?: number;
};

/**
 * Ambil objek JSON dari balasan model yang mungkin "berhias".
 *
 * Gateway ini tidak menjamin `response_format: json_object` dihormati — banyak
 * model tetap membungkus JSON dalam fence ```json, dan sebagian menambahi
 * kalimat pengantar. Parser toleran ini membuat lapisan task tidak bergantung
 * pada kebiasaan satu model tertentu.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidates = [
    fenced?.[1],
    trimmed,
    // Jatuh ke blok `{...}` terluar kalau model menambah kalimat pengantar.
    trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // Coba kandidat berikutnya.
    }
  }

  throw new StructuredGenerationError(
    `Balasan model bukan JSON yang bisa dibaca. Awal balasan: ${trimmed.slice(0, 200)}`,
  );
}

/**
 * Minta model mengembalikan JSON bebas, TANPA validasi schema.
 *
 * Sengaja memakai `generateText` + parser sendiri, bukan `generateObject`:
 * `generateObject` mengandalkan gateway menghormati `response_format`, dan
 * gateway ini tidak. Validasi + retry dikelola pemanggil — lihat
 * `parseTaskListWithRetry` di `lib/ai/schemas/tasks.ts`.
 */
export async function generateJson(
  options: JsonOptions,
): Promise<{ data: unknown; usage: UsageReport }> {
  const tier = options.tier ?? "default";
  const result = await generateText({
    model: modelFor(tier),
    system: `${options.system}\n\nPENTING: balas HANYA dengan satu objek JSON valid. Tanpa penjelasan, tanpa teks pembuka, tanpa fence markdown.`,
    prompt: options.prompt,
    temperature: options.temperature ?? 0.3,
    maxOutputTokens: options.maxOutputTokens ?? 12000,
  });

  return {
    data: extractJson(result.text),
    usage: toUsageReport(tier, result.usage),
  };
}

export class StructuredGenerationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StructuredGenerationError";
  }
}

export type StructuredOptions<T> = {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  tier?: ModelTier;
  temperature?: number;
  maxOutputTokens?: number;
  /** Nama schema — membantu model memahami bentuk yang diminta. */
  schemaName?: string;
  schemaDescription?: string;
};

export type StructuredResult<T> = {
  data: T;
  usage: UsageReport;
};

/**
 * Generasi output terstruktur + validasi Zod.
 *
 * Sesuai ARCHITECTURE §6: kalau validasi gagal, retry SATU kali dengan pesan
 * error dilampirkan, lalu gagal dengan rapi (`StructuredGenerationError`).
 */
export async function generateStructured<T>(
  options: StructuredOptions<T>,
): Promise<StructuredResult<T>> {
  const tier = options.tier ?? "default";

  const attempt = async (prompt: string) =>
    generateObject({
      model: modelFor(tier),
      schema: options.schema,
      schemaName: options.schemaName,
      schemaDescription: options.schemaDescription,
      system: options.system,
      prompt,
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 8000,
    });

  try {
    const result = await attempt(options.prompt);
    return {
      data: result.object as T,
      usage: toUsageReport(tier, result.usage),
    };
  } catch (firstError) {
    const reason =
      firstError instanceof Error ? firstError.message : String(firstError);

    try {
      const result = await attempt(
        `${options.prompt}\n\n---\nPercobaan sebelumnya GAGAL divalidasi dengan error berikut:\n${reason}\n\nPerbaiki dan kembalikan JSON yang benar-benar sesuai schema. Jangan tambahkan field di luar schema.`,
      );
      return {
        data: result.object as T,
        usage: toUsageReport(tier, result.usage),
      };
    } catch (secondError) {
      throw new StructuredGenerationError(
        "Model gagal menghasilkan output yang lolos validasi setelah 2 percobaan.",
        { cause: secondError },
      );
    }
  }
}
