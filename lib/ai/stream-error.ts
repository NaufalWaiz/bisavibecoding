/**
 * Protokol kecil untuk melaporkan kegagalan yang terjadi DI TENGAH stream.
 *
 * Kenapa perlu: route AI mengembalikan `Response` sebelum token pertama tiba.
 * Kalau panggilan LLM gagal setelah itu (base URL salah, slug model tidak ada,
 * kredit habis), status HTTP-nya tetap 200 dan client hanya menerima teks
 * kosong — aplikasi terlihat "diam" tanpa penjelasan. Marker ini membuat alasan
 * kegagalan ikut mengalir ke client.
 *
 * Marker sengaja memakai ASCII biasa (bukan karakter kontrol) supaya aman
 * melewati proxy dan mudah dibaca saat debugging dengan curl.
 *
 * File ini tidak mengimpor apa pun dari server, jadi aman dipakai di client.
 */

export const STREAM_ERROR_MARKER = "\n\n[[ARSITEK_STREAM_ERROR]] ";

/**
 * Pisahkan teks hasil stream menjadi konten dan pesan error (kalau ada).
 * Dipakai client sebelum menampilkan atau menyimpan hasil stream.
 */
export function splitStreamError(raw: string): {
  content: string;
  error: string | null;
} {
  const index = raw.indexOf(STREAM_ERROR_MARKER);
  if (index === -1) return { content: raw, error: null };
  return {
    content: raw.slice(0, index).trimEnd(),
    error:
      raw.slice(index + STREAM_ERROR_MARKER.length).trim() || "Generasi gagal.",
  };
}
