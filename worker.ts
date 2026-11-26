interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 處理 Jira API CORS 代理端點
    if (url.pathname === "/api/jira/proxy") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (request.method === "POST") {
        try {
          const { method, endpoint, config, body } = (await request.json()) as any;

          if (!config?.baseUrl || !config?.email || !config?.apiToken) {
            return new Response(
              JSON.stringify({ error: "Jira 配置不完整，需包含 baseUrl、email 與 apiToken" }),
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }

          const auth = btoa(`${config.email}:${config.apiToken}`);
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
            return new Response(
              JSON.stringify({
                error: `Jira API 錯誤 (${response.status})`,
                details: responseText,
                status: response.status,
              }),
              {
                status: response.status,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            data = responseText;
          }

          return new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              error: "代理請求失敗",
              details: error?.message || String(error),
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
      }

      return new Response("Method not allowed", { status: 405 });
    }

    // 其它前端靜態頁面交由 ASSETS 處理 (包含 SPA fallback)
    return env.ASSETS.fetch(request);
  },
};
