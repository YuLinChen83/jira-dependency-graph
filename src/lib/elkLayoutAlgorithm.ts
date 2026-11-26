import ELK from "elkjs/lib/elk.bundled.js";
import { JiraCard, JiraRelation, FlowNode, FlowEdge } from "../types/jira";
import { MarkerType } from "reactflow";

// ELK.js 實例
const elk = new ELK();

// 節點和邊的配置
const nodeDefaults = {
  width: 400,
  height: 220,
};

// ELK 布局選項
const elkOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.edgeRouting": "SPLINES",
  "elk.layered.spacing.nodeNodeBetweenLayers": "80",
  "elk.spacing.nodeNode": "120",
  "elk.layered.spacing.edgeNode": "40",
  "elk.layered.spacing.edgeNodeBetweenLayers": "40",
  "elk.padding": "[top=30,left=25,bottom=30,right=25]",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED", // 強制左右平衡對稱
};

// 只使用上下左右中心點的極簡連接埠
const getNodePorts = (nodeId: string) => [
  { id: `${nodeId}-top`, properties: { side: "NORTH" } },
  { id: `${nodeId}-bottom`, properties: { side: "SOUTH" } },
  { id: `${nodeId}-left`, properties: { side: "WEST" } },
  { id: `${nodeId}-right`, properties: { side: "EAST" } },
];

// 從卡片 summary 中提取排序號碼
const extractCardNumber = (summary: string): { major: number; minor: number } => {
  const match = summary.match(/(\d+)-(\d+)/);
  if (match) {
    return { major: parseInt(match[1], 10), minor: parseInt(match[2], 10) };
  }
  const singleMatch = summary.match(/(\d+)/);
  if (singleMatch) {
    return { major: parseInt(singleMatch[1], 10), minor: 0 };
  }
  return { major: 999, minor: 999 };
};

// 根據卡片類型確定基礎層級
const getBaseLayer = (card: JiraCard): number => {
  switch (card.issueType.toLowerCase()) {
    case "epic":
      return 0;
    case "story":
      return 1;
    case "tech":
      return 2;
    case "bug":
      return 3;
    default:
      return 4;
  }
};

type BlockingDirection = "outward" | "inward" | "none";

const getBlockingDirection = (relationType: string): BlockingDirection => {
  if (!relationType) return "none";
  const lowerType = relationType.toLowerCase();

  if (lowerType === "is blocked by") {
    return "inward";
  }
  if (lowerType.includes("block")) {
    return "outward";
  }
  return "none";
};

// 主要的 ELK 布局計算函數
export const calculateElkLayout = async (
  cards: JiraCard[],
  relations: JiraRelation[]
): Promise<{ nodes: FlowNode[]; edges: FlowEdge[] }> => {
  if (cards.length === 0) {
    return { nodes: [], edges: [] };
  }

  const cardMap = new Map(cards.map((card) => [card.id, card]));

  // 1. 關係去重
  const relationKeys = new Set<string>();
  const uniqueRelations = relations.filter((rel) => {
    const sourceExists = cardMap.has(rel.fromCardId);
    const targetExists = cardMap.has(rel.toCardId);
    if (!sourceExists || !targetExists) return false;

    let key: string;
    if (getBlockingDirection(rel.relationType) !== "none") {
      // 對於阻塞關係，key 是非定向的，以合併 `blocks` 和 `is-blocked-by`
      const ids = [rel.fromCardId, rel.toCardId].sort();
      key = `${ids[0]}-${ids[1]}-blocking`;
    } else {
      // 對於所有其他關係類型，key 是定向的
      key = `${rel.fromCardId}-${rel.toCardId}-${rel.relationType}`;
    }

    if (relationKeys.has(key)) {
      return false;
    }
    relationKeys.add(key);
    return true;
  });

  // 2. 根據 'blocks' 關係預先調整層級
  const layerMap = new Map<string, number>();
  cards.forEach((card) => layerMap.set(card.id, getBaseLayer(card)));

  const blockRelations = uniqueRelations.filter(
    (r) => getBlockingDirection(r.relationType) !== "none"
  );

  for (let i = 0; i < cards.length; i++) {
    let changed = false;
    for (const relation of blockRelations) {
      const direction = getBlockingDirection(relation.relationType);
      // 'outward' (A blocks B) -> A is source
      // 'inward' (A is blocked by B) -> B is source
      const sourceId = direction === "inward" ? relation.toCardId : relation.fromCardId;
      const targetId = direction === "inward" ? relation.fromCardId : relation.toCardId;

      const sourceLayer = layerMap.get(sourceId)!;
      const targetLayer = layerMap.get(targetId)!;

      if (sourceLayer >= targetLayer) {
        layerMap.set(targetId, sourceLayer + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 3. 對卡片進行排序以支援有序布局
  const sortedCards = [...cards].sort((a, b) => {
    const layerA = layerMap.get(a.id)!;
    const layerB = layerMap.get(b.id)!;
    if (layerA !== layerB) {
      return layerA - layerB;
    }

    if (a.issueType.toLowerCase() === "story" && b.issueType.toLowerCase() === "story") {
      const numberA = extractCardNumber(a.summary);
      const numberB = extractCardNumber(b.summary);
      if (numberA.major !== numberB.major) {
        return numberA.major - numberB.major;
      }
      return numberA.minor - numberB.minor;
    }

    return a.summary.localeCompare(b.summary);
  });

  // 4. 構建 ELK 節點
  const elkNodes = sortedCards.map((card, index) => ({
    id: card.id,
    ...nodeDefaults,
    ports: getNodePorts(card.id),
    layoutOptions: {
      "elk.layered.layer": layerMap.get(card.id)!.toString(),
      "elk.priority": (1000 - index).toString(),
    },
  }));

  // 5. 構建 ELK 邊線
  const elkEdges = uniqueRelations.map((relation) => ({
    id: relation.id,
    sources: [relation.fromCardId],
    targets: [relation.toCardId],
  }));

  const elkGraph = {
    id: "root",
    layoutOptions: elkOptions,
    children: elkNodes,
    edges: elkEdges,
  };

  try {
    const layoutedGraph = await elk.layout(elkGraph);
    const layoutedNodeMap = new Map(layoutedGraph.children?.map((n) => [n.id, n]));

    // 轉換為 React Flow 節點
    const nodes: FlowNode[] =
      layoutedGraph.children?.map((elkNode) => ({
        id: elkNode.id,
        type: "jiraCard",
        position: { x: elkNode.x || 0, y: elkNode.y || 0 },
        data: {
          card: cardMap.get(elkNode.id)!,
          onClick: () => {},
        },
      })) || [];

    // 轉換為 React Flow 邊線
    const edges = uniqueRelations
      .map((relation) => {
        const direction = getBlockingDirection(relation.relationType);
        const isBlockingRelation = direction !== "none";

        const sourceId = direction === "inward" ? relation.toCardId : relation.fromCardId;
        const targetId = direction === "inward" ? relation.fromCardId : relation.toCardId;

        const sourceNode = layoutedNodeMap.get(sourceId);
        const targetNode = layoutedNodeMap.get(targetId);

        if (!sourceNode || !targetNode) {
          return null;
        }

        let sourceDir: string;
        let targetDir: string;

        const yDiff = (targetNode.y || 0) - (sourceNode.y || 0);
        const xDiff = (targetNode.x || 0) - (sourceNode.x || 0);

        if (Math.abs(yDiff) > 80) {
          // 垂直連線 (目標在上或下)
          sourceDir = yDiff > 0 ? "bottom" : "top";
          targetDir = yDiff > 0 ? "top" : "bottom";
        } else {
          // 水平連線 (幾乎同層)
          if (xDiff > 0) {
            sourceDir = "right";
            targetDir = "left";
          } else {
            sourceDir = "left";
            targetDir = "right";
          }
        }

        return {
          id: relation.id,
          source: sourceId,
          target: targetId,
          sourceHandle: `${sourceDir}-source`,
          targetHandle: `${targetDir}-target`,
          type: "default",
          animated: isBlockingRelation,
          style: {
            stroke: isBlockingRelation
              ? "#ef4444"
              : relation.relationType === "relates"
                ? "#10b981"
                : "#6b7280",
            strokeWidth: isBlockingRelation ? 3 : 2,
            strokeDasharray: relation.relationType === "relates" ? "8,4" : undefined,
          },
          markerEnd: isBlockingRelation
            ? {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: "#ef4444",
              }
            : undefined,
          data: { relation },
        };
      })
      .filter((edge) => edge !== null) as FlowEdge[];

    return { nodes, edges };
  } catch (error) {
    console.error("ELK layout calculation failed:", error);
    const fallbackNodes: FlowNode[] = cards.map((card, index) => ({
      id: card.id,
      type: "jiraCard",
      position: { x: (index % 4) * 450, y: Math.floor(index / 4) * 300 },
      data: { card, onClick: () => {} },
    }));
    return { nodes: fallbackNodes, edges: [] };
  }
};
