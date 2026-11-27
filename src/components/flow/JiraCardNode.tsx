import React from "react";
import { Handle, Position } from "reactflow";
import { JiraCard } from "../../types/jira";
import { ExternalLink, User, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface JiraCardNodeProps {
  data: {
    card: JiraCard;
    onClick: (card: JiraCard) => void;
    isBottleneck?: boolean;
    isCriticalPath?: boolean;
  };
}

const getIssueTypeIcon = (issueType: string) => {
  switch (issueType) {
    case "Epic":
      return "🎯";
    case "Story":
      return "📖";
    case "Tech":
      return "⚙️";
    case "Bug":
      return "🐛";
    default:
      return "📋";
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "to do":
      return "bg-gray-100 text-gray-800";
    case "in progress":
      return "bg-blue-100 text-blue-800";
    case "done":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "text-red-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

export default function JiraCardNode({ data }: JiraCardNodeProps) {
  const { card, onClick, isBottleneck, isCriticalPath } = data;

  const handleClick = () => {
    onClick(card);
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(card.url, "_blank");
  };

  return (
    <div
      className={cn(
        "relative bg-white border-2 rounded-lg p-4 shadow-md hover:shadow-lg transition-all cursor-pointer w-[400px]",
        card.issueType.toLowerCase() === "epic" &&
          "border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100",
        card.issueType.toLowerCase() === "story" && "border-emerald-400",
        card.issueType.toLowerCase() === "tech" && "border-blue-400",
        card.issueType.toLowerCase() === "bug" && "border-red-400",
        isCriticalPath && "border-red-500 border-2 shadow-lg shadow-red-100/50",
        isBottleneck && "animate-bottleneck-card"
      )}
      onClick={handleClick}
    >
      {/* 頂部徽章 */}
      {(isBottleneck || isCriticalPath) && (
        <div className="absolute -top-3.5 left-4 flex gap-2 z-[9999] pointer-events-none">
          {isBottleneck && (
            <span className="bg-red-600 text-white text-[10px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-md flex items-center gap-1">
              🚨 依賴瓶頸
            </span>
          )}
          {isCriticalPath && (
            <span className="bg-red-500 text-white text-[10px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-md flex items-center gap-1">
              ⚡ 關鍵路徑
            </span>
          )}
        </div>
      )}

      {/* Top Handles (Center) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
      />

      {/* Bottom Handles (Center) */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}
      />

      {/* Left Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ left: 0, top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ left: 0, top: "50%", transform: "translateY(-50%)" }}
      />

      {/* Right Handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ right: 0, top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-2 h-2 opacity-0 pointer-events-none"
        style={{ right: 0, top: "50%", transform: "translateY(-50%)" }}
      />

      {/* 卡片標題 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getIssueTypeIcon(card.issueType)}</span>
          <div>
            <div className="font-semibold text-sm text-blue-600">{card.key}</div>
            <div className="text-xs text-gray-500">{card.issueType}</div>
          </div>
        </div>
        <button
          onClick={handleExternalLinkClick}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="在 Jira 中開啟"
        >
          <ExternalLink className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 卡片摘要 */}
      <div className="mb-3">
        <p
          className="text-sm font-medium text-gray-900 leading-tight"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: "1.4",
            maxHeight: "4.2em",
          }}
          title={card.summary}
        >
          {card.summary}
        </p>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center justify-between">
          {/* Sprint 資訊 */}
          {card.sprint && (
            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 mr-2 rounded-full text-xs font-medium">
              {card.sprint}
            </span>
          )}

          {/* Status */}
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              getStatusColor(card.status)
            )}
          >
            {card.status}
          </span>
        </div>

        {/* 狀態和優先級 */}
        <div className="flex items-center gap-1">
          <AlertCircle className={cn("w-3 h-3", getPriorityColor(card.priority))} />
          <span className={cn("text-xs font-medium", getPriorityColor(card.priority))}>
            {card.priority}
          </span>
        </div>
      </div>

      {/* 底部資訊區 */}
      <div className="flex items-center justify-between mt-2">
        {/* 指派人員 */}
        {card.assignee && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <User className="w-3 h-3" />
            <span>{card.assignee}</span>
          </div>
        )}

        {/* Story Points */}
        {card.storyPoints && (
          <div className="flex items-center gap-1">
            <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
              {card.storyPoints}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
