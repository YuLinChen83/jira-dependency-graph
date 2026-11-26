import React from "react";
import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";

export default function TroubleshootingGuide() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">連線問題排除指南</h3>

          <div className="space-y-4 text-sm text-yellow-800">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                1. 檢查 Jira URL 格式
              </h4>
              <ul className="list-disc list-inside ml-6 space-y-1 text-yellow-700">
                <li>確保 URL 包含 https:// 或 http://</li>
                <li>
                  正確格式：
                  <code className="bg-yellow-100 px-1 rounded">
                    https://yourcompany.atlassian.net
                  </code>
                </li>
                <li>不要包含 /wiki 或其他路徑</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                2. 驗證 API Token
              </h4>
              <ul className="list-disc list-inside ml-6 space-y-1 text-yellow-700">
                <li>確保使用正確的 Atlassian 帳戶電子郵件</li>
                <li>API Token 必須是有效且未過期的</li>
                <li>
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-yellow-600 hover:text-yellow-800 underline"
                  >
                    重新建立 API Token <ExternalLink size={12} />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                3. 檢查權限設定
              </h4>
              <ul className="list-disc list-inside ml-6 space-y-1 text-yellow-700">
                <li>確保你的帳戶有存取該 Jira 專案的權限</li>
                <li>檢查是否有「瀏覽專案」權限</li>
                <li>確認 API Token 有足夠的權限範圍</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                4. 網路與代理端點
              </h4>
              <ul className="list-disc list-inside ml-6 space-y-1 text-yellow-700">
                <li>本工具透過輕量代理轉發以避免瀏覽器 CORS 限制</li>
                <li>若無法連線，請確認本機開發伺服器或 Cloudflare Pages Functions 正常運作</li>
                <li>請確認公司網路未阻擋對 Atlassian API 的連線</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                5. 常見錯誤代碼
              </h4>
              <ul className="list-disc list-inside ml-6 space-y-1 text-yellow-700">
                <li>
                  <strong>401 未授權：</strong>電子郵件或 API Token 錯誤
                </li>
                <li>
                  <strong>403 禁止存取：</strong>權限不足
                </li>
                <li>
                  <strong>404 找不到：</strong>Jira URL 錯誤
                </li>
                <li>
                  <strong>網路錯誤：</strong>無法連接到伺服器
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-100 rounded border">
            <p className="text-sm text-yellow-800">
              <strong>提示：</strong>
              如果暫無 Jira 帳號或連線失敗，可點擊右上角「🧪 Demo 模擬資料」按鈕快速體驗關聯圖、關鍵路徑分析與拖曳連線等全部功能。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
