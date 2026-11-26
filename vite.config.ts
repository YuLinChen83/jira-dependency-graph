import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import type { IncomingMessage, ServerResponse } from "http";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "jira-proxy-dev-server",
      configureServer(server) {
        server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.url === "/api/jira/proxy" && req.method === "POST") {
            try {
              let bodyStr = "";
              req.on("data", (chunk: any) => {
                bodyStr += chunk;
              });
              req.on("end", async () => {
                try {
                  const { method, endpoint, config, body } = JSON.parse(bodyStr);

                  if (!config?.baseUrl || !config?.email || !config?.apiToken) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "Jira 配置不完整" }));
                    return;
                  }

                  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
                  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");
                  const apiUrl = `${cleanBaseUrl}${endpoint}`;

                  const response = await fetch(apiUrl, {
                    method: method || "GET",
                    headers: {
                      Authorization: `Basic ${auth}`,
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                    body: body ? JSON.stringify(body) : undefined,
                  });

                  const responseText = await response.text();

                  if (!response.ok) {
                    res.statusCode = response.status;
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                      JSON.stringify({
                        error: `Jira API 錯誤 (${response.status})`,
                        details: responseText,
                        status: response.status,
                      })
                    );
                    return;
                  }

                  let data;
                  try {
                    data = JSON.parse(responseText);
                  } catch {
                    data = responseText;
                  }

                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: true, data }));
                } catch (innerErr: any) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "代理轉發處理失敗", details: innerErr.message }));
                }
              });
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "代理伺服器錯誤", details: err.message }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          reactflow: ["reactflow"],
        },
      },
    },
  },
});
