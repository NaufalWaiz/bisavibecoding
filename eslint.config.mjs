import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

/*
 * `eslint-config-next@15` masih berbentuk config eslintrc (bukan flat config),
 * jadi ia harus dibungkus FlatCompat. Template Next 16 mengimpornya langsung
 * sebagai flat config — bentuk itu tidak ada di v15 dan membuat `npm run lint`
 * gagal sebelum memeriksa satu berkas pun. Lihat DECISIONS D-001.
 */
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
