// Jira 卡片類型
export interface JiraCard {
  id: string;
  key: string;
  summary: string;
  issueType: "Epic" | "Story" | "Tech" | "Bug";
  status: string;
  priority: string;
  assignee?: string;
  epicLink?: string;
  url: string;
  description?: string;
  storyPoints?: number;
  sprint?: string;
}

// Jira 關聯類型
export interface JiraRelation {
  id: string;
  fromCardId: string;
  toCardId: string;
  relationType: "blocks" | "is-blocked-by" | "relates" | "duplicates" | "is-duplicated-by";
  description?: string;
}

// Epic 搜尋結果
export interface EpicSearchResult {
  epic: JiraCard;
  relatedCards: JiraCard[];
  relations: JiraRelation[];
}

// Flow 節點類型
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    card: JiraCard;
    onClick: (card: JiraCard) => void;
  };
}

// Flow 邊線類型
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: any;
  markerEnd?: any;
  data?: {
    relation: JiraRelation;
  };
}
