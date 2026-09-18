import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function studyApi(): Plugin {
  return {
    name: "study-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.split("?")[0]?.startsWith("/api/study")) {
          next();
          return;
        }
        void import("./api/study").then(({ handleStudy }) => handleStudy(req, res)).catch((error: unknown) => {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Server error." }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.CURSOR_API_KEY && !process.env.CURSOR_API_KEY) {
    process.env.CURSOR_API_KEY = env.CURSOR_API_KEY;
  }
  return {
    plugins: [react(), tailwindcss(), studyApi()],
  };
});
