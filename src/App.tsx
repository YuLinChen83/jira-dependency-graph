import React, { useState, useCallback, useEffect, useMemo } from "react";
import { JiraCard, EpicSearchResult } from "./types/jira";
import { searchEpicWithJiraApi, createJiraClient, JiraConfig } from "./lib/jiraApi";
import { calculateCriticalPath } from "./lib/criticalPath";
import SearchBar from "./components/ui/SearchBar";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorMessage from "./components/ui/ErrorMessage";
import JiraConfigModal from "./components/ui/JiraConfigModal";
import CardFilter, { FilterOptions } from "./components/ui/CardFilter";
import JiraFlowChart from "./components/flow/JiraFlowChart";
import FlowProvider from "./components/flow/ReactFlowProvider";
import { ExternalLink, Info, Settings, Wifi, WifiOff, Filter } from "lucide-react";

export default function App() {
  const [searchResult, setSearchResult] = useState<EpicSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<JiraCard | null>(null);
  const [jiraConfig, setJiraConfig] = useState<JiraConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCriticalPathActive, setIsCriticalPathActive] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    showEpic: true,
    showStory: true,
    showTech: true,
    showBug: true,
    showIsolatedCards: true,
    showWontFix: false,
    showSpike: false,
    assignee: "",
    keyword: "",
    sprint: "",
  });

  const criticalPathResult = useMemo(() => {
    if (!searchResult || !isCriticalPathActive) return null;
    return calculateCriticalPath(
      searchResult.relatedCards
        ? [searchResult.epic, ...searchResult.relatedCards]
        : [searchResult.epic],
      searchResult.relations
    );
  }, [searchResult, isCriticalPathActive]);

  const testJiraConnection = useCallback(async (config: JiraConfig) => {
    if (!config.baseUrl || !config.email || !config.apiToken) {
      setIsConnected(false);
      return false;
    }
    try {
      const client = createJiraClient(config.baseUrl, config.email, config.apiToken);
      const result = await client.testConnection();
      setIsConnected(result.success);

      if (!result.success) {
        setError(`Jira 連線失敗: ${result.error}`);
      } else {
        setError(null);
      }

      return result.success;
    } catch (error) {
      console.error("測試 Jira 連線失敗:", error);
      setIsConnected(false);
      setError("測試連線時發生未預期的錯誤");
      return false;
    }
  }, []);

  // 載入儲存的 Jira 設定 (完全脫敏，純來自 localStorage)
  useEffect(() => {
    const savedConfig = localStorage.getItem("jiraConfig");
    try {
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setJiraConfig(config);
        if (config.baseUrl && config.email && config.apiToken) {
          testJiraConnection(config);
        }
      }
    } catch (error) {
      console.error("載入 Jira 設定失敗:", error);
    }
  }, [testJiraConnection]);

  const handleSearch = useCallback(
    async (epicKey: string) => {
      setIsLoading(true);
      setError(null);
      setSelectedCard(null);

      try {
        if (!jiraConfig || !jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
          setError("請先設定 Jira API 連線");
          setIsConfigModalOpen(true);
          return;
        }

        const result = await searchEpicWithJiraApi(epicKey, jiraConfig);

        if (result) {
          setSearchResult(result);
        } else {
          setError(`找不到 Epic: ${epicKey}`);
          setSearchResult(null);
        }
      } catch (err: any) {
        console.error("搜尋錯誤:", err);
        setError(err.message || "搜尋時發生錯誤，請稍後再試");
        setSearchResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [jiraConfig]
  );

  const handleCardClick = useCallback((card: JiraCard) => {
    setSelectedCard(card);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
  }, []);

  const handleConfigClear = useCallback(() => {
    localStorage.removeItem("jiraConfig");
    setJiraConfig(null);
    setIsConnected(false);
    setSearchResult(null);
    setSelectedCard(null);
    setError(null);
  }, []);

  const handleConfigSave = useCallback(
    async (config: JiraConfig) => {
      setSearchResult(null);
      setJiraConfig(config);
      localStorage.setItem("jiraConfig", JSON.stringify(config));

      const connected = await testJiraConnection(config);
      if (connected) {
        setError(null);
      } else {
        setError("無法連接到 Jira，請檢查設定是否正確");
      }
    },
    [testJiraConnection]
  );

  // 篩選邏輯
  const { filteredCards, filteredRelations, cardCounts, uniqueAssignees, uniqueSprints } =
    useMemo(() => {
      if (!searchResult) {
        return {
          filteredCards: [],
          filteredRelations: [],
          cardCounts: {
            epic: 0,
            story: 0,
            tech: 0,
            bug: 0,
            isolated: 0,
            wontFix: 0,
            spike: 0,
          },
          uniqueAssignees: [],
          uniqueSprints: [],
        };
      }

      const allCards = searchResult.relatedCards;
      const allRelations = searchResult.relations;

      const counts = {
        epic: allCards.filter((card) => card.issueType.toLowerCase() === "epic").length,
        story: allCards.filter((card) => card.issueType.toLowerCase() === "story").length,
        tech: allCards.filter((card) => card.issueType.toLowerCase() === "tech").length,
        bug: allCards.filter((card) => card.issueType.toLowerCase() === "bug").length,
        isolated: 0,
        wontFix: allCards.filter((card) => card.status.toLowerCase() === "won't fix").length,
        spike: allCards.filter((card) => card.summary.toLowerCase().includes("spike")).length,
      };

      const assigneesSet = new Set<string>();
      allCards.forEach((card) => {
        if (card.assignee) assigneesSet.add(card.assignee);
      });
      const uniqueAssignees = Array.from(assigneesSet).sort();

      const sprintsSet = new Set<string>();
      allCards.forEach((card) => {
        if (card.sprint) sprintsSet.add(card.sprint);
      });
      const uniqueSprints = Array.from(sprintsSet).sort();

      const typeAndStatusFilteredCards = allCards.filter((card) => {
        if (!filters.showWontFix && card.status.toLowerCase() === "won't fix") {
          return false;
        }

        if (!filters.showSpike && card.summary.toLowerCase().includes("spike")) {
          return false;
        }

        if (filters.assignee && filters.assignee !== "") {
          if (filters.assignee === "unassigned") {
            if (card.assignee) return false;
          } else {
            if (card.assignee !== filters.assignee) return false;
          }
        }

        if (filters.keyword && filters.keyword !== "") {
          if (!card.summary.toLowerCase().includes(filters.keyword.toLowerCase())) {
            return false;
          }
        }

        if (filters.sprint && filters.sprint !== "") {
          if (filters.sprint === "no-sprint") {
            if (card.sprint) return false;
          } else {
            if (card.sprint !== filters.sprint) return false;
          }
        }

        const type = card.issueType.toLowerCase();
        switch (type) {
          case "epic":
            return filters.showEpic;
          case "story":
            return filters.showStory;
          case "tech":
            return filters.showTech;
          case "bug":
            return filters.showBug;
          default:
            return true;
        }
      });

      const filteredCardIds = new Set(typeAndStatusFilteredCards.map((card) => card.id));

      const filteredRelations = allRelations.filter(
        (relation) =>
          filteredCardIds.has(relation.fromCardId) && filteredCardIds.has(relation.toCardId)
      );

      const connectedCardIds = new Set<string>();
      filteredRelations.forEach((relation) => {
        connectedCardIds.add(relation.fromCardId);
        connectedCardIds.add(relation.toCardId);
      });

      const isolatedCardsList = typeAndStatusFilteredCards.filter(
        (card) => !connectedCardIds.has(card.id)
      );
      const connectedCards = typeAndStatusFilteredCards.filter((card) =>
        connectedCardIds.has(card.id)
      );

      counts.isolated = isolatedCardsList.length;

      const finalCards = filters.showIsolatedCards
        ? typeAndStatusFilteredCards
        : connectedCards;

      return {
        filteredCards: finalCards,
        filteredRelations: filteredRelations,
        cardCounts: counts,
        uniqueAssignees: uniqueAssignees,
        uniqueSprints: uniqueSprints,
      };
    }, [searchResult, filters]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 標題列 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📊</span> Jira 卡片關聯與關鍵路徑可視化
              </h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {/* 關鍵路徑 & 瓶頸按鈕 */}
              {searchResult && (
                <button
                  onClick={() => setIsCriticalPathActive(!isCriticalPathActive)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    isCriticalPathActive
                      ? "bg-red-50 border-red-500 text-red-700 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                      : "bg-gray-100 border-transparent text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>⚡ 關鍵路徑 & 瓶頸</span>
                  {isCriticalPathActive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              )}

              {/* 篩選器按鈕 */}
              {searchResult && (
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter size={16} />
                  <span className="text-sm">篩選卡片</span>
                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                    {Object.values(filters).slice(0, 4).filter(Boolean).length}
                    /4
                  </span>
                </button>
              )}

              {/* API 狀態指示與引導設定按鈕 */}
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
                    <Wifi size={14} className="text-green-600" />
                    <span>Jira 已連線</span>
                  </div>
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Jira API 設定"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold hover:bg-amber-100 hover:border-amber-400 shadow-sm transition-all group"
                  title="點擊設定 Jira API 連線"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <Settings size={14} className="text-amber-700 group-hover:rotate-45 transition-transform" />
                  <span>點此設定 Jira 連線</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 搜尋區域 */}
      <div className="bg-white border-b py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-2 relative">
            <div className="w-full max-w-xl">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isLoading}
                placeholder="輸入 Epic 卡號 (例如: PROJ-101)"
              />
            </div>

            {/* 搜尋結果統計 */}
            {searchResult && (
              <div className="flex items-center gap-4 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Info size={14} />
                  <span>已載入 {filteredCards.length} 張卡片</span>
                </div>
                {filteredCards.some((card) => card.storyPoints) && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-800 rounded">
                    <span>總計:</span>
                    <span className="font-mono font-semibold">
                      {filteredCards
                        .filter((card) => card.storyPoints)
                        .reduce((sum, card) => sum + (card.storyPoints || 0), 0)}{" "}
                      SP
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <main className="flex-1 w-full p-4 overflow-hidden">
        <div className="flex gap-4 h-[calc(100vh-190px)]">
          {/* 流程圖畫布 */}
          <div className="flex-1 h-full bg-white rounded-xl shadow-sm border relative overflow-hidden">
            <FlowProvider>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size={48} text="正在搜尋 Epic 相關卡片..." />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                  <ErrorMessage message={error} onRetry={handleRetry} />
                </div>
              ) : searchResult ? (
                <JiraFlowChart
                  cards={searchResult.relatedCards}
                  relations={searchResult.relations}
                  filteredCards={filteredCards}
                  filteredRelations={filteredRelations}
                  onCardClick={handleCardClick}
                  isCriticalPathActive={isCriticalPathActive}
                  criticalPathResult={criticalPathResult}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center max-w-md px-4">
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-16 w-16 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      開始探索 Jira 卡片關聯圖
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {isConnected
                        ? "請在上方搜尋框輸入 Epic 卡號（例如 PROJ-101）進行查詢"
                        : "初次使用請先完成 Jira API 連線設定，即可開始探索關聯拓撲與關鍵路徑"}
                    </p>
                    {!isConnected && (
                      <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <Settings size={16} />
                        立即設定 Jira 連線
                      </button>
                    )}
                  </div>
                </div>
              )}
            </FlowProvider>
          </div>

          {/* 側邊欄 - 卡片詳情 */}
          {selectedCard && (
            <div className="w-80 h-full bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="text-base font-semibold text-gray-900">卡片詳情</h3>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => window.open(selectedCard.url, "_blank")}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono font-semibold"
                      title="在 Jira 中開啟"
                    >
                      {selectedCard.key}
                      <ExternalLink size={14} />
                    </button>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {selectedCard.issueType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    {selectedCard.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-500 block mb-0.5">狀態</span>
                    <span className="font-medium text-gray-900">{selectedCard.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">優先級</span>
                    <span className="font-medium text-gray-900">{selectedCard.priority}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">負責人</span>
                    <span className="font-medium text-gray-900 truncate block">
                      {selectedCard.assignee || "未指派"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Story Points</span>
                    <span className="font-medium text-gray-900 font-mono">
                      {selectedCard.storyPoints ?? "無"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-0.5">Sprint</span>
                    <span className="font-medium text-gray-900">
                      {selectedCard.sprint || "無"}
                    </span>
                  </div>
                </div>

                {selectedCard.description && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1">描述</span>
                    <div
                      className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100"
                      dangerouslySetInnerHTML={{
                        __html: selectedCard.description,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Jira 設定彈窗 */}
      <JiraConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleConfigSave}
        onClear={handleConfigClear}
        initialConfig={jiraConfig || undefined}
      />

      {/* 篩選器彈窗 */}
      {searchResult && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${
            isFilterModalOpen ? "" : "hidden"
          }`}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">卡片篩選設定</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <CardFilter
                filters={filters}
                onFiltersChange={setFilters}
                cardCounts={cardCounts}
                cards={filteredCards}
                assignees={uniqueAssignees}
                sprints={uniqueSprints}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
