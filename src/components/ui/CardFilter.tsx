import React from "react";
import { Eye, EyeOff } from "lucide-react";

export interface FilterOptions {
  showEpic: boolean;
  showStory: boolean;
  showTech: boolean;
  showBug: boolean;
  showIsolatedCards: boolean;
  showWontFix: boolean;
  showSpike: boolean;
  assignee: string;
  keyword: string;
  sprint: string;
}

interface CardFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  cardCounts: {
    epic: number;
    story: number;
    tech: number;
    bug: number;
    isolated: number;
    wontFix: number;
    spike: number;
  };
  cards?: any[];
  assignees?: string[];
  sprints?: string[];
}

export default function CardFilter({
  filters,
  onFiltersChange,
  cardCounts,
  cards = [],
  assignees = [],
  sprints = [],
}: CardFilterProps) {
  const handleTypeToggle = (type: keyof FilterOptions) => {
    const newFilters = {
      ...filters,
      [type]: !filters[type],
    };
    onFiltersChange(newFilters);
  };

  const handleIsolatedToggle = () => {
    const newFilters = {
      ...filters,
      showIsolatedCards: !filters.showIsolatedCards,
    };
    onFiltersChange(newFilters);
  };

  const handleSpikeToggle = () => {
    const newFilters = {
      ...filters,
      showSpike: !filters.showSpike,
    };
    onFiltersChange(newFilters);
  };

  const handleWontFixToggle = () => {
    const newFilters = {
      ...filters,
      showWontFix: !filters.showWontFix,
    };
    onFiltersChange(newFilters);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "epic":
        return "border-purple-500 bg-purple-50 text-purple-700";
      case "story":
        return "border-green-500 bg-green-50 text-green-700";
      case "tech":
        return "border-blue-500 bg-blue-50 text-blue-700";
      case "bug":
        return "border-red-500 bg-red-50 text-red-700";
      case "wontfix":
        return "border-red-300 bg-red-50 text-red-700";
      default:
        return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "epic":
        return "🎯";
      case "story":
        return "📖";
      case "tech":
        return "⚙️";
      case "bug":
        return "🐛";
      case "wontfix":
        return "❌";
      default:
        return "📋";
    }
  };

  return (
    <div className="space-y-4">
      {/* 快速操作 */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() =>
              onFiltersChange({
                showEpic: true,
                showStory: true,
                showTech: true,
                showBug: true,
                showWontFix: true,
                showIsolatedCards: true,
                showSpike: true,
                assignee: "",
                keyword: "",
                sprint: "",
              })
            }
            className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            全選
          </button>
          <button
            onClick={() =>
              onFiltersChange({
                showEpic: false,
                showStory: false,
                showTech: false,
                showBug: false,
                showWontFix: false,
                showIsolatedCards: false,
                showSpike: false,
                assignee: "",
                keyword: "",
                sprint: "",
              })
            }
            className="flex-1 px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            全不選
          </button>
        </div>
      </div>

      {/* 關鍵字與負責人與Sprint */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">進階篩選</h4>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">負責人</label>
            <select
              value={filters.assignee}
              onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value })}
              className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            >
              <option value="">全部</option>
              <option value="unassigned">未指派</option>
              {assignees?.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">標題關鍵字</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
              placeholder="輸入關鍵字..."
              className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sprint</label>
            <select
              value={filters.sprint}
              onChange={(e) => onFiltersChange({ ...filters, sprint: e.target.value })}
              className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            >
              <option value="">全部</option>
              <option value="no-sprint">無 Sprint</option>
              {sprints?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 卡片類型篩選 */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">顯示卡片類型</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              key: "showEpic" as const,
              type: "epic",
              label: "Epic",
              count: cardCounts.epic,
            },
            {
              key: "showStory" as const,
              type: "story",
              label: "Story",
              count: cardCounts.story,
            },
            {
              key: "showTech" as const,
              type: "tech",
              label: "Tech",
              count: cardCounts.tech,
            },
            {
              key: "showBug" as const,
              type: "bug",
              label: "Bug",
              count: cardCounts.bug,
            },
          ].map(({ key, type, label, count }) => (
            <button
              key={key}
              onClick={() => handleTypeToggle(key)}
              className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
                filters[key] ? getTypeColor(type) : "border-gray-200 bg-gray-50 text-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {filters[key] ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className="text-lg">{getTypeIcon(type)}</span>
                <span className="text-sm font-medium">{label}</span>
              </div>
              <span className="text-xs bg-white px-1.5 py-0.5 rounded-full">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 狀態與其他篩選 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">狀態與其他篩選</h4>
        <div className="grid grid-cols-2 gap-2">
          {/* Won't Fix */}
          <button
            onClick={handleWontFixToggle}
            className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
              filters.showWontFix
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-200 bg-gray-50 text-gray-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {filters.showWontFix ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="text-sm font-medium">Won&apos;t Fix</span>
            </div>
            <span className="text-xs bg-white px-1.5 py-0.5 rounded-full">
              {cardCounts.wontFix}
            </span>
          </button>

          {/* Isolated Cards */}
          <button
            onClick={handleIsolatedToggle}
            className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
              filters.showIsolatedCards
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-gray-50 text-gray-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {filters.showIsolatedCards ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="text-sm font-medium">孤立卡片</span>
            </div>
            <span className="text-xs bg-white px-1.5 py-0.5 rounded-full">
              {cardCounts.isolated}
            </span>
          </button>

          {/* Spike */}
          <button
            onClick={handleSpikeToggle}
            className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
              filters.showSpike
                ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                : "border-gray-200 bg-gray-50 text-gray-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {filters.showSpike ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="text-sm font-medium">Spike</span>
            </div>
            <span className="text-xs bg-white px-1.5 py-0.5 rounded-full">{cardCounts.spike}</span>
          </button>
        </div>
      </div>

      {/* Story Points 統計區塊 */}
      {cards.length > 0 && cards.some((card) => card.storyPoints) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Story Points 統計</h4>

          {/* 總計 */}
          <div className="mb-3 p-2 bg-blue-50 rounded">
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-900 font-medium">總計</span>
              <span className="font-mono font-bold text-blue-900">
                {cards
                  .filter((card) => card.storyPoints)
                  .reduce((sum, card) => sum + (card.storyPoints || 0), 0)}{" "}
                points
              </span>
            </div>
          </div>

          {/* 按狀態統計 */}
          <div className="space-y-1">
            {(() => {
              const statusConfig = [
                { name: "Done", color: "bg-green-500", priority: 1 },
                { name: "QA", color: "bg-yellow-500", priority: 2 },
                { name: "PR", color: "bg-purple-500", priority: 3 },
                { name: "Developing", color: "bg-blue-500", priority: 4 },
                { name: "Backlog", color: "bg-gray-300", priority: 5 },
                {
                  name: "Ready for Development",
                  color: "bg-cyan-400",
                  priority: 6,
                },
                { name: "Won't Fix", color: "bg-red-300", priority: 7 },
              ];

              const statusSet = new Set(cards.map((card) => card.status));
              const actualStatuses = Array.from(statusSet);

              const allStatuses = actualStatuses
                .map((status) => {
                  const config = statusConfig.find(
                    (s) => s.name.toLowerCase() === status.toLowerCase()
                  );
                  return {
                    name: status,
                    color: config?.color || "bg-gray-400",
                    priority: config?.priority || 999,
                  };
                })
                .sort((a, b) => a.priority - b.priority);

              return allStatuses.map(({ name: status, color }) => {
                const statusCards = cards.filter(
                  (card) => card.status.toLowerCase() === status.toLowerCase() && card.storyPoints
                );
                const statusPoints = statusCards.reduce(
                  (sum, card) => sum + (card.storyPoints || 0),
                  0
                );

                if (statusPoints === 0) return null;

                return (
                  <div key={status} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color}`}></span>
                      <span className="truncate max-w-[120px]" title={status}>
                        {status}
                      </span>
                      <span className="text-gray-400">({statusCards.length})</span>
                    </div>
                    <span className="font-mono font-medium">{statusPoints} SP</span>
                  </div>
                );
              });
            })()}
          </div>

          {/* 進度條 */}
          {(() => {
            const totalPoints = cards
              .filter((card) => card.storyPoints)
              .reduce((sum, card) => sum + (card.storyPoints || 0), 0);
            const donePoints = cards
              .filter((card) => card.status.toLowerCase() === "done" && card.storyPoints)
              .reduce((sum, card) => sum + (card.storyPoints || 0), 0);
            const inProgressPoints = cards
              .filter(
                (card) => ["Developing", "PR", "QA"].includes(card.status) && card.storyPoints
              )
              .reduce((sum, card) => sum + (card.storyPoints || 0), 0);

            if (totalPoints === 0) return null;

            const donePercentage = (donePoints / totalPoints) * 100;
            const inProgressPercentage = (inProgressPoints / totalPoints) * 100;

            return (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>進度</span>
                  <span>{Math.round(donePercentage)}% 完成</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500" style={{ width: `${donePercentage}%` }}></div>
                    <div className="bg-blue-500" style={{ width: `${inProgressPercentage}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>完成: {donePoints} SP</span>
                  <span>進行中: {inProgressPoints} SP</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
