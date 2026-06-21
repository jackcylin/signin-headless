import { defineConfig } from "tsup";

export default defineConfig([
  { entry: ["src/index.js", "src/element.js"], format: ["esm"], dts: true, clean: true, external: ["lit", "@hiko/signin-widget"] },
  { entry: { "hiko-signin-headless": "src/element.js" }, format: ["iife"], globalName: "HikoSigninHeadless", noExternal: ["lit", "@hiko/signin-widget"], minify: true, outDir: "dist", outExtension: () => ({ js: ".iife.js" }) },
]);
