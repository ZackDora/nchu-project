import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { handler as nchuHandler } from "./netlify/functions/nchu.mjs";

type NetlifyFunctionResponse = {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
};

const readRequestBody = (req: import("node:http").IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });

const nchuDataPlugin = (): Plugin => ({
  name: "nchu-data-api",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
      if (!requestUrl.pathname.startsWith("/api/nchu/")) {
        next();
        return;
      }

      try {
        const response = await nchuHandler({
          path: requestUrl.pathname,
          rawQuery: requestUrl.searchParams.toString(),
          httpMethod: req.method ?? "GET",
          body: req.method === "POST" ? await readRequestBody(req) : "",
        }) as NetlifyFunctionResponse;

        res.statusCode = response.statusCode ?? 200;
        for (const [name, value] of Object.entries(response.headers ?? {})) {
          res.setHeader(name, value);
        }
        res.end(response.body ?? "");
      } catch (error) {
        res.statusCode = 502;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "NCHU data request failed" }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.GROQ_API_KEY ||= env.GROQ_API_KEY;
  process.env.GROQ_MODEL ||= env.GROQ_MODEL;
  const basePath = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || (process.env.NETLIFY ? "/" : "/nchu-project/");

  return {
    base: basePath,
    plugins: [react(), nchuDataPlugin()],
  };
});
