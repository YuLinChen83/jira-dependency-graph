import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { createJiraClient, JiraConfig } from "../../lib/jiraApi";

interface ConnectionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JiraConfig;
}

interface TestResult {
  step: string;
  status: "pending" | "success" | "error";
  message: string;
  details?: any;
}

export default function ConnectionTestModal({ isOpen, onClose, config }: ConnectionTestModalProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runConnectionTest = useCallback(async () => {
    setIsTestingConnection(true);
    setTestResults([]);

    const results: TestResult[] = [];

    // 步驟 1: 檢查 URL 格式
    results.push({
      step: "檢查 URL 格式",
      status: "pending",
      message: "驗證 Jira URL 格式...",
    });
    setTestResults([...results]);

    try {
      new URL(config.baseUrl);
      results[0] = {
        step: "檢查 URL 格式",
        status: "success",
        message: "URL 格式正確",
      };
    } catch (error) {
      results[0] = {
        step: "檢查 URL 格式",
        status: "error",
        message: "URL 格式不正確",
        details: error,
      };
      setTestResults([...results]);
      setIsTestingConnection(false);
      return;
    }
    setTestResults([...results]);

    // 步驟 2: 測試網路連線
    results.push({
      step: "測試網路連線",
      status: "pending",
      message: "嘗試連接到 Jira 伺服器...",
    });
    setTestResults([...results]);

    try {
      const client = createJiraClient(config.baseUrl, config.email, config.apiToken);
      const connectionResult = await client.testConnection();

      if (connectionResult.success) {
        results[1] = {
          step: "測試網路連線",
          status: "success",
          message: "成功連接到 Jira",
          details: connectionResult.details,
        };

        // 步驟 3: 驗證權限
        results.push({
          step: "驗證權限",
          status: "success",
          message: `已登入為: ${connectionResult.details?.displayName || connectionResult.details?.emailAddress || "未知使用者"}`,
        });
      } else {
        results[1] = {
          step: "測試網路連線",
          status: "error",
          message: connectionResult.error || "連線失敗",
          details: connectionResult.details,
        };
      }
    } catch (error: any) {
      results[1] = {
        step: "測試網路連線",
        status: "error",
        message: "網路連線失敗",
        details: error.message,
      };
    }

    setTestResults([...results]);
    setIsTestingConnection(false);
  }, [config.baseUrl, config.email, config.apiToken]);

  useEffect(() => {
    if (isOpen && config.baseUrl && config.email && config.apiToken) {
      runConnectionTest();
    }
  }, [isOpen, runConnectionTest, config.baseUrl, config.email, config.apiToken]);

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="animate-spin text-blue-500" size={16} />;
      case "success":
        return <CheckCircle className="text-green-500" size={16} />;
      case "error":
        return <XCircle className="text-red-500" size={16} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">連線測試</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* 設定資訊 */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-700 mb-3">測試設定</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Jira URL:</span>
              <span className="ml-2 font-mono">{config.baseUrl}</span>
            </div>
            <div>
              <span className="text-gray-600">電子郵件:</span>
              <span className="ml-2">{config.email}</span>
            </div>
            <div>
              <span className="text-gray-600">API Token:</span>
              <span className="ml-2 font-mono">
                {"*".repeat(Math.min(config.apiToken.length, 20))}
              </span>
            </div>
          </div>
        </div>

        {/* 測試結果 */}
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">測試結果</h3>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{result.step}</div>
                  <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                  {result.details && result.status === "error" && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        顯示詳細錯誤
                      </summary>
                      <pre className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded overflow-x-auto">
                        {typeof result.details === "string"
                          ? result.details
                          : JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            關閉
          </button>
          <button
            type="button"
            onClick={runConnectionTest}
            disabled={isTestingConnection}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                測試中...
              </>
            ) : (
              "重新測試"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
