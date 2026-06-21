import { defineConfig } from "vite";

// Vite drives the local dev server (`npm run dev`) for the runnable demo in
// index.html. Its production build (`vite build`) writes to dist-dev/ so it can
// never collide with the tsup library build in dist/ (the published package).
export default defineConfig({
  build: { outDir: "dist-dev" },
});
