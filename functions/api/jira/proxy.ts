/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Pages Function: Jira API CORS 代理端點
 * 透過 Edge Worker 發送請求至 Jira REST API，消除前端瀏覽器的跨域 (CORS) 限制
 */
export const onRequestPost: PagesFunction = async (context) => {
  const { request } = context;

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

    // 建立 Basic Auth Header (使用 Web 標準 btoa)
    const auth = btoa(`${config.email}:${config.apiToken}`);
    const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");
    const apiUrl = `${cleanBaseUrl}${endpoint}`;

    // 發送請求到 Jira API
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

    // 嘗試解析 JSON
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
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
