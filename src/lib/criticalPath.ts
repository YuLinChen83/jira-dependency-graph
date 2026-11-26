import { JiraCard, JiraRelation } from "../types/jira";

export interface CriticalPathResult {
  criticalCardIds: Set<string>;
  criticalRelationIds: Set<string>;
  bottleneckCardIds: Set<string>;
  maxChainLength: number;
}

/**
 * Calculates the critical paths and bottleneck nodes in a graph of Jira cards and relations.
 *
 * A critical path is a longest path of blocker relations in the graph.
 * A bottleneck card is a card that has either in-degree >= 2 or out-degree >= 2 in the blocker graph.
 *
 * @param cards List of Jira cards
 * @param relations List of relations between Jira cards
 */
export function calculateCriticalPath(
  cards: JiraCard[],
  relations: JiraRelation[]
): CriticalPathResult {
  const criticalCardIds = new Set<string>();
  const criticalRelationIds = new Set<string>();
  const bottleneckCardIds = new Set<string>();

  if (!cards || cards.length === 0) {
    return {
      criticalCardIds,
      criticalRelationIds,
      bottleneckCardIds,
      maxChainLength: 0,
    };
  }

  // a) Create card ID lookup set
  const cardIds = new Set(cards.map((c) => c.id));

  // b) Filter and normalize relations into directed blocker edges
  // we map relationType:
  // "blocks": fromCardId blocks toCardId (from -> to)
  // "is-blocked-by": fromCardId is blocked by toCardId (to -> from)
  const edges: { from: string; to: string; relationId: string }[] = [];
  const adj = new Map<string, { to: string; relationId: string }[]>();
  const inDegree = new Map<string, number>();

  cards.forEach((c) => {
    adj.set(c.id, []);
    inDegree.set(c.id, 0);
  });

  relations.forEach((rel) => {
    let from: string | null = null;
    let to: string | null = null;

    if (rel.relationType === "blocks") {
      from = rel.fromCardId;
      to = rel.toCardId;
    } else if (rel.relationType === "is-blocked-by") {
      from = rel.toCardId;
      to = rel.fromCardId;
    }

    // Filter to nodes actually present in cards
    if (from && to && cardIds.has(from) && cardIds.has(to)) {
      edges.push({ from, to, relationId: rel.id });
      adj.get(from)!.push({ to, relationId: rel.id });
      inDegree.set(to, inDegree.get(to)! + 1);
    }
  });

  // d) Compute bottleneck nodes:
  // Identify cards that have in-degree >= 2 in the blocker graph or out-degree >= 2.
  // This is based on the full filtered blocker graph (even if cyclic).
  const inDegreeFull = new Map<string, number>();
  const outDegreeFull = new Map<string, number>();

  cards.forEach((c) => {
    inDegreeFull.set(c.id, 0);
    outDegreeFull.set(c.id, 0);
  });

  edges.forEach((edge) => {
    inDegreeFull.set(edge.to, (inDegreeFull.get(edge.to) || 0) + 1);
    outDegreeFull.set(edge.from, (outDegreeFull.get(edge.from) || 0) + 1);
  });

  cards.forEach((c) => {
    const inDeg = inDegreeFull.get(c.id) || 0;
    const outDeg = outDegreeFull.get(c.id) || 0;
    if (inDeg >= 2 || outDeg >= 2) {
      bottleneckCardIds.add(c.id);
    }
  });

  // c) Topological sort & longest path calculation (DAG longest path)
  // We use Kahn's algorithm to obtain topological sort and detect/omit cycle components safely.
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      queue.push(id);
    }
  });

  const topoOrder: string[] = [];
  const tempInDegree = new Map(inDegree);
  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);
    const neighbors = adj.get(u) || [];
    neighbors.forEach((edge) => {
      const v = edge.to;
      const newDeg = (tempInDegree.get(v) || 0) - 1;
      tempInDegree.set(v, newDeg);
      if (newDeg === 0) {
        queue.push(v);
      }
    });
  }

  // Compute longest path distances on DAG.
  // Only nodes in topoOrder are part of the DAG portion and initialized to 0.
  const dist = new Map<string, number>();
  topoOrder.forEach((u) => {
    dist.set(u, 0);
  });

  topoOrder.forEach((u) => {
    const uDist = dist.get(u)!;
    const neighbors = adj.get(u) || [];
    neighbors.forEach((edge) => {
      const v = edge.to;
      if (dist.has(v)) {
        const newDist = uDist + 1;
        if (newDist > (dist.get(v) || 0)) {
          dist.set(v, newDist);
        }
      }
    });
  });

  let maxChainLength = 0;
  dist.forEach((d) => {
    if (d > maxChainLength) {
      maxChainLength = d;
    }
  });

  // Backtrack to collect all cards and relations on paths with maximum distance >= 1
  if (maxChainLength >= 1) {
    const endNodes = cards
      .filter((c) => dist.has(c.id) && dist.get(c.id) === maxChainLength)
      .map((c) => c.id);

    // Build incoming edges map for reverse lookup
    const incoming = new Map<string, { from: string; relationId: string }[]>();
    cards.forEach((c) => {
      incoming.set(c.id, []);
    });
    edges.forEach((edge) => {
      incoming.get(edge.to)!.push({ from: edge.from, relationId: edge.relationId });
    });

    const backtracked = new Set<string>();

    const backtrack = (v: string) => {
      if (backtracked.has(v)) return;
      backtracked.add(v);
      criticalCardIds.add(v);

      const vDist = dist.get(v)!;
      if (vDist === 0) return; // Reached start of the path

      const incomingEdges = incoming.get(v) || [];
      incomingEdges.forEach((edge) => {
        const u = edge.from;
        if (dist.has(u)) {
          const uDist = dist.get(u)!;
          if (uDist + 1 === vDist) {
            criticalRelationIds.add(edge.relationId);
            backtrack(u);
          }
        }
      });
    };

    endNodes.forEach((end) => {
      backtrack(end);
    });
  }

  return {
    criticalCardIds,
    criticalRelationIds,
    bottleneckCardIds,
    maxChainLength,
  };
}
