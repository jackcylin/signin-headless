import { defineConfig } from "tsup";

export default defineConfig([
  { entry: ["src/index.js", "src/element.js"], format: ["esm"], dts: true, clean: true, external: ["lit"] },
  { entry: { "hiko-signin-headless": "src/element.js" }, format: ["iife"], globalName: "HikoSigninHeadless", noExternal: ["lit"], minify: true, outDir: "dist", outExtension: () => ({ js: ".iife.js" }), define: { "process.env.NODE_ENV": JSON.stringify("production") } },
]);
