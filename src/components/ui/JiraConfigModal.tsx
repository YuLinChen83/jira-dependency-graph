import React, { useEffect, useState } from "react";
import {
  X,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  TestTube,
  HelpCircle,
  Trash2,
} from "lucide-react";
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
  onClear?: () => void;
  initialConfig?: Partial<JiraConfig>;
}

export default function JiraConfigModal({
  isOpen,
  onClose,
  onSave,
  onClear,
  initialConfig,
}: JiraConfigModalProps) {
  const [config, setConfig] = useState<JiraConfig>({
    baseUrl: initialConfig?.baseUrl || "",
    email: initialConfig?.email || "",
    apiToken: initialConfig?.apiToken || "",
  });

  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<Partial<JiraConfig>>({});
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // 當彈窗打開時同步初始設定（僅依賴 primitive 屬性，避免在輸入時被重新覆寫）
  useEffect(() => {
    if (isOpen) {
      setConfig({
        baseUrl: initialConfig?.baseUrl || "",
        email: initialConfig?.email || "",
        apiToken: initialConfig?.apiToken || "",
      });
      setErrors({});
    }
  }, [isOpen, initialConfig?.baseUrl, initialConfig?.email, initialConfig?.apiToken]);

  const getNormalizedConfig = (raw: JiraConfig): JiraConfig => {
    let baseUrl = raw.baseUrl.trim();
    if (baseUrl && !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/+$/, "");

    return {
      baseUrl,
      email: raw.email.trim(),
      apiToken: raw.apiToken.trim(),
    };
  };

  const validateConfig = (): boolean => {
    const newErrors: Partial<JiraConfig> = {};
    const norm = getNormalizedConfig(config);

    if (!norm.baseUrl) {
      newErrors.baseUrl = "請輸入 Jira 網站 URL";
    } else {
      try {
        new URL(norm.baseUrl);
      } catch {
        newErrors.baseUrl = "請輸入有效的 URL 格式";
      }
    }

    if (!norm.email) {
      newErrors.email = "請輸入電子郵件地址";
    } else if (!norm.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "請輸入有效的電子郵件地址";
    }

    if (!norm.apiToken) {
      newErrors.apiToken = "請輸入 API Token";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateConfig()) {
      onSave(getNormalizedConfig(config));
      onClose();
    }
  };

  const handleInputChange = (field: keyof JiraConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClear = () => {
    if (window.confirm("確定要清除本機瀏覽器中儲存的 Jira 連線設定嗎？")) {
      if (onClear) {
        onClear();
      }
      setConfig({ baseUrl: "", email: "", apiToken: "" });
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentNormalized = getNormalizedConfig(config);
  const hasSavedConfig = Boolean(initialConfig?.baseUrl || initialConfig?.email);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Jira API 設定</h2>
            <p className="text-xs text-gray-500 mt-0.5">配置您的 Jira 連線以探索卡片關聯與關鍵路徑</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="顯示故障排除指南"
            >
              <HelpCircle size={20} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 資安隱私承諾保證 */}
        <div className="p-5 bg-gradient-to-b from-emerald-50 to-teal-50/40 border-b border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div className="text-xs text-emerald-950 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-emerald-900 text-sm">
                🛡️ 零信任隱私與安全保證 (Zero-Trust BYOC)
              </p>
              <ul className="list-disc list-inside space-y-1 text-emerald-800">
                <li>
                  <strong className="text-emerald-950">純本機存儲</strong>：您的網址、Email 與 Token 僅保存在目前瀏覽器的 <code className="bg-emerald-100/70 px-1 py-0.2 rounded font-mono">localStorage</code>，不進任何資料庫或伺服器。
                </li>
                <li>
                  <strong className="text-emerald-950">嚴格唯讀 (Read-Only)</strong>：本工具僅讀取卡片關聯拓撲，絕無建立、編輯或刪除卡片的權限。
                </li>
                <li>
                  <strong className="text-emerald-950">無狀態加密中繼</strong>：透過邊緣無狀態代理消除瀏覽器 CORS 限制，記憶體即發即丟，<span className="underline">絕不留存帳密 Log</span>。
                </li>
              </ul>
              <div className="pt-1">
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline font-medium"
                >
                  前往 Atlassian 官方建立 API Token <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 表單 */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Jira 網站 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jira 網站 URL *</label>
            <input
              type="text"
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">API Token *</label>
              <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck size={12} /> 僅保存在本機瀏覽器
              </span>
            </div>
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

          {/* 按鈕列 */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            {hasSavedConfig ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                title="清除瀏覽器中儲存的 Jira 設定"
              >
                <Trash2 size={16} />
                清除憑證
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (validateConfig()) {
                    setIsTestModalOpen(true);
                  }
                }}
                disabled={!config.baseUrl || !config.email || !config.apiToken}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <TestTube size={16} />
                測試連線
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                儲存設定
              </button>
            </div>
          </div>

          {/* 故障排除指南 */}
          {showTroubleshooting && <TroubleshootingGuide />}
        </form>
      </div>

      {/* 連線測試彈窗 */}
      <ConnectionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        config={currentNormalized}
      />
    </div>
  );
}
