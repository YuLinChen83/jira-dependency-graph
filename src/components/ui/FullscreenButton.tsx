import React, { useState, useEffect } from "react";
import {
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface FullscreenButtonProps {
  targetRef: React.RefObject<HTMLDivElement>;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export default function FullscreenButton({ targetRef, onFullscreenChange }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      onFullscreenChange?.(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onFullscreenChange]);

  const toggleFullscreen = async () => {
    if (!targetRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await targetRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("全屏切換失敗:", error);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      title={isFullscreen ? "退出全屏" : "進入全屏"}
    >
      {isFullscreen ? (
        <Minimize size={16} className="text-gray-600" />
      ) : (
        <Maximize size={16} className="text-gray-600" />
      )}
    </button>
  );
}

interface FlowControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  onExportPng?: () => void;
  isExporting?: boolean;
  onToggleZenMode?: () => void;
  isZenMode?: boolean;
}

export function FlowControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onFullscreen,
  isFullscreen,
  onExportPng,
  isExporting = false,
  onToggleZenMode,
  isZenMode = false,
}: FlowControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-50 flex flex-col gap-1.5 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
        title="放大 (Zoom In)"
      >
        <ZoomIn size={16} />
      </button>

      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
        title="縮小 (Zoom Out)"
      >
        <ZoomOut size={16} />
      </button>

      <button
        onClick={onFitView}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
        title="適應視窗 (Fit View)"
      >
        <RotateCcw size={16} />
      </button>

      <div className="h-px bg-gray-200 my-0.5"></div>

      {/* 一鍵截圖匯出 PNG 按鈕 */}
      {onExportPng && (
        <button
          onClick={onExportPng}
          disabled={isExporting}
          className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors text-gray-700 disabled:opacity-50"
          title="匯出高清 PNG 圖檔"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          ) : (
            <Camera size={16} />
          )}
        </button>
      )}

      {/* 專注模式切換按鈕 */}
      {onToggleZenMode && (
        <button
          onClick={onToggleZenMode}
          className={`p-2 rounded-md transition-colors ${
            isZenMode
              ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          title={isZenMode ? "退出專注模式 (ESC)" : "專注模式 (收合頂部，最大化畫布)"}
        >
          {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}

      {/* 瀏覽器全螢幕切換按鈕 */}
      <button
        onClick={onFullscreen}
        className={`p-2 rounded-md transition-colors ${
          isFullscreen
            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        title={isFullscreen ? "退出瀏覽器全螢幕" : "進入瀏覽器全螢幕"}
      >
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
    </div>
  );
}
