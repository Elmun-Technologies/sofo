import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", ".open-next/**", ".wrangler/**", "freebuff-sites-build/**", "node_modules/**", "design/**", "next-env.d.ts", "lib/generated/**", "freebuff.open-next.config.ts"] },
];

export default config;
