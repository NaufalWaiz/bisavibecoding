"use client";

/**
 * Renderer markdown minimal untuk output LLM.
 *
 * Sengaja tidak memakai library markdown: konten yang dihasilkan bisavibecoding
 * hanya memakai heading, daftar, teks tebal, dan blok kode — dan renderer kecil
 * ini aman dipakai saat teks masih setengah jadi (streaming).
 *
 * Dua hal yang harus dijaga di sini:
 * 1. Daftar bertanda (`- `) TIDAK boleh dirender sebagai daftar bernomor.
 *    Versi sebelumnya menyamakan keduanya, sehingga bullet di PRD muncul
 *    sebagai angka 1..17 beruntun dan pembaca mengira itu urutan langkah.
 * 2. Heading dirender sebagai elemen heading sungguhan dengan `id`, supaya
 *    daftar isi di halaman PRD bisa benar-benar melompat ke bagiannya.
 */

import { Fragment } from "react";

export type DocHeading = { level: number; text: string; id: string };

/** Ubah judul jadi id anchor yang stabil dan aman dipakai di URL. */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[`*_~]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "bagian"
  );
}

/** Kumpulkan heading untuk daftar isi, tanpa perlu merender dokumennya dulu. */
export function extractHeadings(content: string): DocHeading[] {
  const seen = new Map<string, number>();
  const headings: DocHeading[] = [];
  let insideCode = false;

  for (const line of content.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      insideCode = !insideCode;
      continue;
    }
    if (insideCode) continue;

    const match = line.match(/^(#{1,4})\s+(.*)$/);
    if (!match) continue;

    const text = match[2].replace(/[*_`]/g, "").trim();
    if (!text) continue;

    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    headings.push({
      level: match[1].length,
      text,
      id: count === 0 ? base : `${base}-${count + 1}`,
    });
  }

  return headings;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  // Pecah pada `code`, **bold**, *italic*, dan [teks](url).
  const parts = text.split(
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g,
  );

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.85em] text-brand-stronger"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      !part.startsWith("**") &&
      part.length > 2
    ) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="text-brand-stronger underline underline-offset-2 hover:text-brand"
        >
          {link[1]}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

type ListItem = { text: string; depth: number };

const HEADING_CLASS = [
  "mt-8 mb-3 text-h2 first:mt-0",
  "mt-8 mb-3 text-h3 first:mt-0 border-t border-border/70 pt-6 first:border-0 first:pt-0",
  "mt-6 mb-2 text-body font-semibold first:mt-0",
  "mt-5 mb-2 text-small font-semibold uppercase tracking-wide text-muted-foreground first:mt-0",
];

export function StreamMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];

  let listBuffer: ListItem[] = [];
  let listOrdered = false;
  let codeBuffer: string[] | null = null;
  let codeLang = "";

  const headingCount = new Map<string, number>();

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = listBuffer;
    const ordered = listOrdered;
    listBuffer = [];

    const key = `list-${blocks.length}`;
    const ListTag = ordered ? "ol" : "ul";

    // Rakit maksimal dua tingkat: item berindentasi digabung ke item induknya.
    const tree: { item: ListItem; children: ListItem[] }[] = [];
    for (const item of items) {
      if (item.depth > 0 && tree.length > 0) {
        tree[tree.length - 1].children.push(item);
      } else {
        tree.push({ item, children: [] });
      }
    }

    blocks.push(
      <ListTag
        key={key}
        className={
          ordered
            ? "my-3 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-brand-stronger"
            : "my-3 list-disc space-y-2 pl-5 marker:text-brand"
        }
      >
        {tree.map((node, index) => (
          <li key={index} className="leading-relaxed">
            {renderInline(node.item.text, `${key}-${index}`)}
            {node.children.length > 0 ? (
              <ul className="mt-2 list-[circle] space-y-1.5 pl-5 marker:text-border-strong">
                {node.children.map((child, childIndex) => (
                  <li key={childIndex}>
                    {renderInline(child.text, `${key}-${index}-${childIndex}`)}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ListTag>,
    );
  };

  const pushCode = (key: string, body: string[]) => {
    blocks.push(
      <div
        key={key}
        className="my-4 overflow-hidden rounded-xl border border-code-border bg-code-bg"
      >
        {codeLang ? (
          <div className="border-b border-code-border px-4 py-1.5 font-mono text-[11px] text-code-muted">
            {codeLang}
          </div>
        ) : null}
        <pre className="pane-scroll-dark overflow-x-auto p-4 font-mono text-tiny leading-relaxed text-code-foreground">
          <code>{body.join("\n")}</code>
        </pre>
      </div>,
    );
  };

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (codeBuffer === null) {
        flushList();
        codeBuffer = [];
        codeLang = trimmed.slice(3).trim();
      } else {
        pushCode(`code-${index}`, codeBuffer);
        codeBuffer = null;
        codeLang = "";
      }
      continue;
    }

    if (codeBuffer !== null) {
      codeBuffer.push(line);
      continue;
    }

    const orderedMatch = line.match(/^(\s*)\d+[.)]\s+(.*)$/);
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    const listMatch = orderedMatch ?? bulletMatch;

    if (listMatch) {
      const ordered = Boolean(orderedMatch);
      // Ganti jenis daftar = daftar baru, jangan disambung diam-diam.
      if (listBuffer.length > 0 && ordered !== listOrdered) flushList();
      listOrdered = ordered;
      listBuffer.push({
        text: listMatch[2],
        depth: listMatch[1].length >= 2 ? 1 : 0,
      });
      continue;
    }

    flushList();

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push(
        <hr key={`hr-${index}`} className="my-6 border-t border-border" />,
      );
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const raw = headingMatch[2].trim();
      const plain = raw.replace(/[*_`]/g, "").trim();

      const base = slugify(plain);
      const seen = headingCount.get(base) ?? 0;
      headingCount.set(base, seen + 1);
      const id = seen === 0 ? base : `${base}-${seen + 1}`;

      const Tag = (["h2", "h3", "h4", "h5"] as const)[level - 1];
      blocks.push(
        <Tag
          key={`h-${index}`}
          id={id}
          className={`doc-anchor font-heading text-foreground ${HEADING_CLASS[level - 1]}`}
        >
          {renderInline(raw, `h-${index}`)}
        </Tag>,
      );
      continue;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`q-${index}`}
          className="my-4 border-l-2 border-brand-soft-border bg-brand-soft/30 py-2 pl-4 text-muted-foreground italic"
        >
          {renderInline(trimmed.slice(2), `q-${index}`)}
        </blockquote>,
      );
      continue;
    }

    if (trimmed === "") continue;

    blocks.push(
      <p key={`p-${index}`} className="my-3 leading-relaxed">
        {renderInline(line, `p-${index}`)}
      </p>,
    );
  }

  flushList();
  if (codeBuffer !== null && codeBuffer.length > 0) {
    pushCode("code-open", codeBuffer);
  }

  return (
    <div className={className ?? "text-small text-foreground"}>{blocks}</div>
  );
}
