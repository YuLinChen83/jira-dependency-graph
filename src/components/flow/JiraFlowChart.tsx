import React, { useCallback, useRef, useState } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";

import JiraCardNode from "./JiraCardNode";
import CustomBezierEdge from "./CustomBezierEdge";
import { FlowControls } from "../ui/FullscreenButton";
import { JiraCard, JiraRelation } from "../../types/jira";
import { calculateElkLayout } from "../../lib/elkLayoutAlgorithm";

const nodeTypes = {
  jiraCard: JiraCardNode,
};

const edgeTypes = {
  default: CustomBezierEdge,
};

export interface JiraFlowChartProps {
  cards: JiraCard[];
  relations: JiraRelation[];
  onCardClick: (card: JiraCard) => void;
  filteredCards?: JiraCard[];
  filteredRelations?: JiraRelation[];
  isCriticalPathActive?: boolean;
  criticalPathResult?: {
    criticalCardIds: Set<string>;
    criticalRelationIds: Set<string>;
    bottleneckCardIds: Set<string>;
  } | null;
  epicKey?: string;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

export default function JiraFlowChart({
  cards,
  relations,
  onCardClick,
  filteredCards,
  filteredRelations,
  isCriticalPathActive = false,
  criticalPathResult = null,
  epicKey,
  isZenMode,
  onToggleZenMode,
}: JiraFlowChartProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleFullscreen = useCallback(async () => {
    if (!flowRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await flowRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("全屏切換失敗:", error);
    }
  }, []);

  // 當 cards 或 relations 改變時更新節點和邊線
  React.useEffect(() => {
    if (!isClient) return;

    const cardsToUse = filteredCards || cards;
    const relationsToUse = filteredRelations || relations;

    if (cardsToUse.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const updateLayoutWithElk = async () => {
      try {
        const { nodes: elkNodes, edges: elkEdges } = await calculateElkLayout(
          cardsToUse,
          relationsToUse
        );

        const nodesWithHandler = elkNodes.map((node) => {
          const cardId = node.id;
          const isCritical =
            isCriticalPathActive && !!criticalPathResult?.criticalCardIds.has(cardId);
          const isBottleneck =
            isCriticalPathActive && !!criticalPathResult?.bottleneckCardIds.has(cardId);

          return {
            ...node,
            data: {
              ...node.data,
              onClick: onCardClick,
              isCriticalPath: isCritical,
              isBottleneck: isBottleneck,
            },
          };
        });

        const edgesWithCriticalPath = elkEdges.map((edge) => {
          const relationId = edge.id;
          const isCritical =
            isCriticalPathActive && !!criticalPathResult?.criticalRelationIds.has(relationId);

          return {
            ...edge,
            data: {
              ...edge.data,
              isCriticalPath: isCritical,
            },
            style: isCritical
              ? {
                  ...edge.style,
                  stroke: "#ef4444",
                  strokeWidth: 4,
                }
              : edge.style,
            animated: isCritical ? true : edge.animated,
            markerEnd: isCritical
              ? {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: "#ef4444",
                }
              : edge.markerEnd,
          };
        });

        setNodes(nodesWithHandler);
        setEdges(edgesWithCriticalPath);
      } catch (error) {
        console.error("ELK 佈局計算失敗:", error);
        setNodes([]);
        setEdges([]);
      }
    };

    updateLayoutWithElk();
  }, [
    filteredCards,
    cards,
    filteredRelations,
    relations,
    onCardClick,
    setNodes,
    setEdges,
    isClient,
    isCriticalPathActive,
    criticalPathResult,
  ]);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">載入中...</h3>
          <p className="text-gray-500">正在初始化圖表</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">尚未搜尋 Epic</h3>
          <p className="text-gray-500">請在上方輸入 Epic 卡號來查看相關卡片</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={flowRef}
      className={`w-full h-full relative ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}
    >
      <ReactFlowWithControls
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        isFullscreen={isFullscreen}
        onFullscreen={handleFullscreen}
        epicKey={epicKey}
        isZenMode={isZenMode}
        onToggleZenMode={onToggleZenMode}
      />
    </div>
  );
}

function ReactFlowWithControls({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  isFullscreen,
  onFullscreen,
  epicKey,
  isZenMode,
  onToggleZenMode,
}: {
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  nodeTypes: any;
  isFullscreen: boolean;
  onFullscreen: () => void;
  epicKey?: string;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}) {
  const { zoomIn, zoomOut, fitView, getNodes } = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPng = useCallback(async () => {
    const currentNodes = getNodes();
    if (!currentNodes || currentNodes.length === 0) return;

    setIsExporting(true);
    try {
      const nodesBounds = getNodesBounds(currentNodes);
      const padding = 60;
      const imageWidth = Math.max(800, Math.round(nodesBounds.width + padding * 2));
      const imageHeight = Math.max(600, Math.round(nodesBounds.height + padding * 2));

      const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewport) {
        throw new Error("找不到畫布 Viewport 節點");
      }

      const transform = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.1,
        2,
        0.1
      );

      const dataUrl = await toPng(viewport, {
        backgroundColor: "#ffffff",
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        },
        pixelRatio: 2,
      });

      const downloadLink = document.createElement("a");
      downloadLink.download = `Jira-Dependency-${epicKey || "graph"}.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
    } catch (error) {
      console.error("匯出圖檔失敗:", error);
    } finally {
      setIsExporting(false);
    }
  }, [getNodes, epicKey]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesConnectable={false}
        elementsSelectable={true}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        attributionPosition="bottom-left"
        className={`w-full h-full ${isFullscreen ? "!h-screen" : ""}`}
      >
        <Controls
          position="bottom-left"
          className={isFullscreen ? "z-40" : ""}
          style={{ display: "none" }}
        />
        <MiniMap
          nodeColor={(node) => {
            const card = node.data?.card;
            if (!card) return "#e5e7eb";

            switch (card.issueType.toLowerCase()) {
              case "epic":
                return "#8b5cf6";
              case "story":
                return "#10b981";
              case "tech":
                return "#3b82f6";
              case "bug":
                return "#ef4444";
              default:
                return "#6b7280";
            }
          }}
          className={`bg-white border border-gray-200 ${isFullscreen ? "z-40" : ""}`}
          position="bottom-left"
          pannable
          zoomable
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <FlowControls
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView({ padding: 0.05 })}
        onFullscreen={onFullscreen}
        isFullscreen={isFullscreen}
        onExportPng={handleExportPng}
        isExporting={isExporting}
        onToggleZenMode={onToggleZenMode}
        isZenMode={isZenMode}
      />
    </>
  );
}
