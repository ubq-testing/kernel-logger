import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: true,
  target: "esnext",
  outDir: "dist",
  format: ["cjs", "esm"],
});
