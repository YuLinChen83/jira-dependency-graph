import React, { useEffect, useState } from "react";
import { X, Eye, EyeOff, ExternalLink, AlertCircle, TestTube, HelpCircle } from "lucide-react";
import ConnectionTestModal from "./ConnectionTestModal";
import TroubleshootingGuide from "./TroubleshootingGuide";

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface JiraConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: JiraConfig) => void;
  initialConfig?: Partial<JiraConfig>;
}

export default function JiraConfigModal({
  isOpen,
  onClose,
  onSave,
  initialConfig = {},
}: JiraConfigModalProps) {
  const [config, setConfig] = useState<JiraConfig>({
    baseUrl: initialConfig.baseUrl || "",
    email: initialConfig.email || "",
    apiToken: initialConfig.apiToken || "",
  });

  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<Partial<JiraConfig>>({});
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const validateConfig = (): boolean => {
    const newErrors: Partial<JiraConfig> = {};

    if (!config.baseUrl.trim()) {
      newErrors.baseUrl = "請輸入 Jira 網站 URL";
    } else if (!config.baseUrl.match(/^https?:\/\/.+/)) {
      newErrors.baseUrl = "請輸入有效的 URL (包含 http:// 或 https://)";
    }

    if (!config.email.trim()) {
      newErrors.email = "請輸入電子郵件地址";
    } else if (!config.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "請輸入有效的電子郵件地址";
    }

    if (!config.apiToken.trim()) {
      newErrors.apiToken = "請輸入 API Token";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateConfig()) {
      onSave(config);
      onClose();
    }
  };

  const handleInputChange = (field: keyof JiraConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  useEffect(() => {
    setConfig({
      baseUrl: initialConfig.baseUrl || "",
      email: initialConfig.email || "",
      apiToken: initialConfig.apiToken || "",
    });
  }, [initialConfig]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Jira API 設定</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="顯示故障排除指南"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 說明區域 */}
        <div className="p-6 bg-blue-50 border-b">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">如何取得 Jira API Token：</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>登入你的 Atlassian 帳戶</li>
                <li>前往 Account Settings → Security</li>
                <li>點擊 &quot;Create and manage API tokens&quot;</li>
                <li>建立新的 API Token 並複製</li>
              </ol>
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                前往建立 API Token <ExternalLink size={12} />
              </a>

              <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-900">
                <p className="font-medium">✅ CORS 問題已解決</p>
                <p>此應用程式使用邊緣無伺服器代理（Edge Proxy）來避免瀏覽器的 CORS 限制，你可以安全使用 Jira API。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Jira 網站 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jira 網站 URL *</label>
            <input
              type="url"
              value={config.baseUrl}
              onChange={(e) => handleInputChange("baseUrl", e.target.value)}
              placeholder="https://yourcompany.atlassian.net"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                errors.baseUrl ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.baseUrl && <p className="mt-1 text-sm text-red-600">{errors.baseUrl}</p>}
          </div>

          {/* 電子郵件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件地址 *</label>
            <input
              type="email"
              value={config.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="your-email@company.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* API Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Token *</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={config.apiToken}
                onChange={(e) => handleInputChange("apiToken", e.target.value)}
                placeholder="輸入你的 Jira API Token"
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  errors.apiToken ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.apiToken && <p className="mt-1 text-sm text-red-600">{errors.apiToken}</p>}
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => setIsTestModalOpen(true)}
              disabled={!config.baseUrl || !config.email || !config.apiToken}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <TestTube size={16} />
              測試連線
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              儲存設定
            </button>
          </div>

          {/* 故障排除指南 */}
          {showTroubleshooting && <TroubleshootingGuide />}
        </form>
      </div>

      {/* 連線測試彈窗 */}
      <ConnectionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        config={config}
      />
    </div>
  );
}
