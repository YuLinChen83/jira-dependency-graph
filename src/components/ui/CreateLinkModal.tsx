import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  ShieldAlert,
  Link2,
  HelpCircle,
} from "lucide-react";
import { JiraCard } from "../../types/jira";
import { cn } from "../../lib/utils";
import LoadingSpinner from "./LoadingSpinner";

export interface CreateLinkModalProps {
  isOpen: boolean;
  sourceCard: JiraCard | null;
  targetCard: JiraCard | null;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: (relationType: "blocks" | "is-blocked-by" | "relates") => void;
  onClose: () => void;
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

export default function CreateLinkModal({
  isOpen,
  sourceCard,
  targetCard,
  isLoading = false,
  error = null,
  onConfirm,
  onClose,
}: CreateLinkModalProps) {
  const [selectedType, setSelectedType] = useState<"blocks" | "is-blocked-by" | "relates">(
    "relates"
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedType("relates");
    }
  }, [isOpen]);

  if (!isOpen || !sourceCard || !targetCard) return null;

  const handleConfirm = () => {
    onConfirm(selectedType);
  };

  const relationOptions = [
    {
      id: "blocks" as const,
      title: "阻礙 (Blocks)",
      description: `${sourceCard.key} 阻礙 ${targetCard.key} 的進度 (Source blocks Target)`,
      icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
    },
    {
      id: "is-blocked-by" as const,
      title: "被阻礙 (Is Blocked By)",
      description: `${sourceCard.key} 的進度被 ${targetCard.key} 阻礙 (Source is blocked by Target)`,
      icon: <HelpCircle className="w-5 h-5 text-yellow-500" />,
    },
    {
      id: "relates" as const,
      title: "相關 (Relates To)",
      description: `${sourceCard.key} 與 ${targetCard.key} 存在一般關聯 (Relates to each other)`,
      icon: <Link2 className="w-5 h-5 text-blue-500" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20">
            <LoadingSpinner size={36} text="正在建立關聯..." />
          </div>
        )}

        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">建立卡片關聯</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* 內容區 */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Error alert banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Visual Connection Card Flow */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {/* Source Card */}
            <div className="flex-1 w-full p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{getIssueTypeIcon(sourceCard.issueType)}</span>
                <span className="font-semibold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {sourceCard.key}
                </span>
                <span
                  className={cn(
                    "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                    getStatusColor(sourceCard.status)
                  )}
                >
                  {sourceCard.status}
                </span>
              </div>
              <h4
                className="text-sm font-medium text-gray-900 line-clamp-2"
                title={sourceCard.summary}
              >
                {sourceCard.summary}
              </h4>
            </div>

            {/* Connection Arrow */}
            <div className="flex flex-col items-center justify-center text-gray-400 min-w-[120px] py-2 md:py-0">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mb-2">
                {selectedType === "blocks"
                  ? "阻礙 (Blocks)"
                  : selectedType === "is-blocked-by"
                    ? "被阻礙 (Blocked By)"
                    : "關聯 (Relates)"}
              </span>
              {selectedType === "is-blocked-by" ? (
                <div className="flex items-center gap-1">
                  <ArrowLeft className="w-5 h-5 text-blue-500 animate-pulse" />
                  <span className="h-0.5 w-12 bg-blue-400" />
                </div>
              ) : selectedType === "blocks" ? (
                <div className="flex items-center gap-1">
                  <span className="h-0.5 w-12 bg-blue-400" />
                  <ArrowRight className="w-5 h-5 text-blue-500 animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <ArrowLeftRight className="w-5 h-5 text-blue-500" />
                </div>
              )}
            </div>

            {/* Target Card */}
            <div className="flex-1 w-full p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{getIssueTypeIcon(targetCard.issueType)}</span>
                <span className="font-semibold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {targetCard.key}
                </span>
                <span
                  className={cn(
                    "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                    getStatusColor(targetCard.status)
                  )}
                >
                  {targetCard.status}
                </span>
              </div>
              <h4
                className="text-sm font-medium text-gray-900 line-clamp-2"
                title={targetCard.summary}
              >
                {targetCard.summary}
              </h4>
            </div>
          </div>

          {/* Relation Selection Card List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">請選擇關聯類型</label>
            <div className="grid grid-cols-1 gap-3">
              {relationOptions.map((option) => {
                const isSelected = selectedType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedType(option.id)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg mt-0.5",
                        isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{option.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {option.description}
                      </div>
                    </div>
                    <div className="flex items-center self-center">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-blue-500" : "border-gray-300"
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
          >
            建立關聯
          </button>
        </div>
      </div>
    </div>
  );
}
