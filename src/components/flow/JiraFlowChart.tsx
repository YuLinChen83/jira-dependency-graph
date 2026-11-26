import React, { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import JiraCardNode from "./JiraCardNode";
import CustomBezierEdge from "./CustomBezierEdge";
import { FlowControls } from "../ui/FullscreenButton";
import { JiraCard, JiraRelation } from "../../types/jira";
import { calculateElkLayout } from "../../lib/elkLayoutAlgorithm";
import CreateLinkModal from "../ui/CreateLinkModal";

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
  onCreateLink?: (
    sourceCard: JiraCard,
    targetCard: JiraCard,
    relationType: "blocks" | "is-blocked-by" | "relates"
  ) => Promise<void>;
  onDeleteLink?: (relationId: string) => Promise<void>;
}

export default function JiraFlowChart({
  cards,
  relations,
  onCardClick,
  filteredCards,
  filteredRelations,
  isCriticalPathActive = false,
  criticalPathResult = null,
  onCreateLink,
  onDeleteLink,
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSourceCard, setModalSourceCard] = useState<JiraCard | null>(null);
  const [modalTargetCard, setModalTargetCard] = useState<JiraCard | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!onCreateLink) {
        setEdges((eds) => addEdge(params, eds));
        return;
      }

      const sourceId = params.source;
      const targetId = params.target;
      if (!sourceId || !targetId) return;

      const sourceCard = cards.find((c) => c.id === sourceId);
      const targetCard = cards.find((c) => c.id === targetId);
      if (!sourceCard || !targetCard) return;

      setModalSourceCard(sourceCard);
      setModalTargetCard(targetCard);
      setModalError(null);
      setIsModalOpen(true);
    },
    [onCreateLink, cards, setEdges]
  );

  const handleConfirmCreateLink = async (relationType: "blocks" | "is-blocked-by" | "relates") => {
    if (!onCreateLink || !modalSourceCard || !modalTargetCard) return;
    setIsModalLoading(true);
    setModalError(null);
    try {
      await onCreateLink(modalSourceCard, modalTargetCard, relationType);
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || "建立關聯失敗");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleEdgeClick = useCallback(
    async (_event: React.MouseEvent, edge: Edge) => {
      if (!onDeleteLink) return;

      const relation = edge.data?.relation;
      if (!relation) return;

      const confirmDelete = window.confirm(
        `確定要刪除此 Issue Link 關聯？\n來源：${edge.source} -> 目標：${edge.target} (${relation.relationType})`
      );
      if (confirmDelete) {
        try {
          await onDeleteLink(relation.id);
        } catch (err: any) {
          alert(`刪除關聯失敗: ${err.message || err}`);
        }
      }
    },
    [onDeleteLink]
  );

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
        onConnect={onConnect}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        isFullscreen={isFullscreen}
        onFullscreen={handleFullscreen}
      />
      <CreateLinkModal
        isOpen={isModalOpen}
        sourceCard={modalSourceCard}
        targetCard={modalTargetCard}
        isLoading={isModalLoading}
        error={modalError}
        onConfirm={handleConfirmCreateLink}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

function ReactFlowWithControls({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgeClick,
  nodeTypes,
  isFullscreen,
  onFullscreen,
}: {
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onEdgeClick?: any;
  nodeTypes: any;
  isFullscreen: boolean;
  onFullscreen: () => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
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
      />
    </>
  );
}
