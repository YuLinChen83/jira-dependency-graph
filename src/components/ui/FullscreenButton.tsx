import React, { useState, useEffect } from "react";
import { Maximize, Minimize, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

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
}

export function FlowControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onFullscreen,
  isFullscreen,
}: FlowControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-gray-50 rounded transition-colors"
        title="放大"
      >
        <ZoomIn size={16} className="text-gray-600" />
      </button>

      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-gray-50 rounded transition-colors"
        title="縮小"
      >
        <ZoomOut size={16} className="text-gray-600" />
      </button>

      <button
        onClick={onFitView}
        className="p-2 hover:bg-gray-50 rounded transition-colors"
        title="適應視窗"
      >
        <RotateCcw size={16} className="text-gray-600" />
      </button>

      <div className="h-px bg-gray-200 my-1"></div>

      <button
        onClick={onFullscreen}
        className={`p-2 rounded transition-colors ${
          isFullscreen
            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
            : "text-gray-600 hover:bg-gray-50"
        }`}
        title={isFullscreen ? "退出全屏 (ESC)" : "進入全屏"}
      >
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
    </div>
  );
}
