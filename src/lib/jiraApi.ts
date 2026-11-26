import { JiraCard, JiraRelation, EpicSearchResult } from "../types/jira";

// Jira API 配置
export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

// Jira API 回應類型
interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
    issuetype: {
      name: string;
      iconUrl?: string;
    };
    status: {
      name: string;
      statusCategory: {
        name: string;
        colorName: string;
      };
    };
    priority?: {
      name: string;
      iconUrl?: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
      accountId: string;
    };
    customfield_10014?: string; // Epic Link
    customfield_10027?: number; // Story Points
    customfield_10010?: Array<{
      id: number;
      name: string;
      state: string;
      boardId: number;
    }>; // Sprint
    parent?: {
      key: string;
      fields: {
        summary: string;
      };
    };
    issuelinks?: Array<{
      id: string;
      type: {
        name: string;
        inward: string;
        outward: string;
      };
      inwardIssue?: JiraIssue;
      outwardIssue?: JiraIssue;
    }>;
  };
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

// Jira API 客戶端類別
export class JiraApiClient {
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
  }

  // 使用代理端點發送請求 (解決 CORS 問題)
  private async proxyRequest(endpoint: string, method: string = "GET", body?: any): Promise<any> {
    const response = await fetch("/api/jira/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method,
        endpoint,
        config: this.config,
        body,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result.data;
  }

  // 執行 JQL 查詢
  async searchIssues(jql: string, fields?: string[]): Promise<JiraSearchResponse> {
    const defaultFields = [
      "summary",
      "description",
      "issuetype",
      "status",
      "priority",
      "assignee",
      "customfield_10014", // Epic Link
      "customfield_10027", // Story Points
      "customfield_10010", // Sprint
      "parent",
      "issuelinks",
    ];

    const searchFields = fields || defaultFields;

    const params = new URLSearchParams({
      jql,
      fields: searchFields.join(","),
      expand: "names",
      maxResults: "100",
    });

    try {
      return await this.proxyRequest(`/rest/api/3/search/jql?${params}`);
    } catch (error) {
      console.error("JQL 查詢失敗:", error);
      throw error;
    }
  }

  // 取得特定 Issue 的詳細資訊
  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      return await this.proxyRequest(`/rest/api/3/issue/${issueKey}?expand=names`);
    } catch (error) {
      console.error(`取得 Issue ${issueKey} 失敗:`, error);
      throw new Error(`無法取得 Issue ${issueKey}: ${error}`);
    }
  }

  // 搜尋 Epic 及其相關卡片
  async searchEpicAndRelatedIssues(epicKey: string): Promise<EpicSearchResult> {
    try {
      // 1. 先取得 Epic 本身
      const epicIssue = await this.getIssue(epicKey);

      if (epicIssue.fields.issuetype.name !== "Epic") {
        throw new Error(`${epicKey} 不是 Epic 類型的卡片`);
      }

      // 2. 搜尋該 Epic 下的所有卡片
      const jql = `"Epic Link" = ${epicKey} OR key = ${epicKey} ORDER BY issuetype DESC, status ASC`;
      const searchResult = await this.searchIssues(jql);

      // 3. 轉換為我們的資料格式
      const cards = searchResult.issues.map((issue) => this.convertToJiraCard(issue));
      const epic = cards.find((card) => card.key === epicKey)!;
      const relatedCards = cards;

      // 4. 分析卡片間的關聯
      const relations = this.extractRelations(searchResult.issues);

      return {
        epic,
        relatedCards,
        relations,
      };
    } catch (error) {
      console.error("搜尋 Epic 時發生錯誤:", error);
      throw error;
    }
  }

  // 將 Jira Issue 轉換為 JiraCard 格式
  private convertToJiraCard(issue: JiraIssue): JiraCard {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");

    let description = "";
    if (issue.fields.description) {
      if (typeof issue.fields.description === "string") {
        description = issue.fields.description;
      } else if (issue.fields.description.content) {
        description = this.extractTextFromADF(issue.fields.description);
      }
    }

    let sprint = "";
    if (
      issue.fields.customfield_10010 &&
      Array.isArray(issue.fields.customfield_10010) &&
      issue.fields.customfield_10010.length > 0
    ) {
      const latestSprint =
        issue.fields.customfield_10010[issue.fields.customfield_10010.length - 1];
      sprint = latestSprint.name;
    }

    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      issueType: (issue.fields.issuetype.name === "Task"
        ? "Tech"
        : issue.fields.issuetype.name) as any,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name || "Medium",
      assignee: issue.fields.assignee?.displayName,
      epicLink: issue.fields.customfield_10014 || issue.fields.parent?.key,
      url: `${baseUrl}/browse/${issue.key}`,
      description,
      storyPoints: issue.fields.customfield_10027 || undefined,
      sprint: sprint || undefined,
    };
  }

  // 從 ADF (Atlassian Document Format) 中提取純文字
  private extractTextFromADF(adf: any): string {
    if (!adf || !adf.content) return "";

    let text = "";
    const extractText = (node: any): void => {
      if (node.type === "text") {
        text += node.text;
      } else if (node.type === "inlineCard") {
        text += `<a href="${node.attrs?.url}" target="_blank" class="text-blue-600 hover:text-blue-800">Link</a>`;
      } else if (node.content) {
        if (node.type === "paragraph" || node.type === "heading") {
          text += "\n";
        }
        node.content.forEach(extractText);
      }
    };

    adf.content.forEach(extractText);
    return text.trim();
  }

  // 從 Issue 連結中提取關聯關係
  private extractRelations(issues: JiraIssue[]): JiraRelation[] {
    const relations: JiraRelation[] = [];
    const issueIds = new Set(issues.map((issue) => issue.id));

    issues.forEach((issue) => {
      if (!issue.fields.issuelinks) return;

      issue.fields.issuelinks.forEach((link) => {
        const linkType = link.type.name.toLowerCase();

        // 處理 outward 關聯
        if (link.outwardIssue && issueIds.has(link.outwardIssue.id)) {
          const relationType = this.mapLinkTypeToRelationType(linkType, "outward", link.type);
          if (relationType) {
            relations.push({
              id: `${link.id}-outward`,
              fromCardId: issue.id,
              toCardId: link.outwardIssue.id,
              relationType,
              description: `${link.type.outward}: ${link.outwardIssue.fields.summary}`,
            });
          }
        }

        // 處理 inward 關聯
        if (link.inwardIssue && issueIds.has(link.inwardIssue.id)) {
          const relationType = this.mapLinkTypeToRelationType(linkType, "inward", link.type);
          if (relationType) {
            relations.push({
              id: `${link.id}-inward`,
              fromCardId: link.inwardIssue.id,
              toCardId: issue.id,
              relationType,
              description: `${link.type.inward}: ${issue.fields.summary}`,
            });
          }
        }
      });
    });

    return relations.filter(
      (relation, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            r.fromCardId === relation.fromCardId &&
            r.toCardId === relation.toCardId &&
            r.relationType === relation.relationType
        )
    );
  }

  // 將 Jira 連結類型映射到關聯類型
  private mapLinkTypeToRelationType(
    linkTypeName: string,
    direction: "inward" | "outward",
    _linkType: any
  ): JiraRelation["relationType"] | null {
    const lowerName = linkTypeName.toLowerCase();

    if (lowerName.includes("block")) {
      return direction === "outward" ? "blocks" : "is-blocked-by";
    }

    if (lowerName.includes("duplicate")) {
      return direction === "outward" ? "duplicates" : "is-duplicated-by";
    }

    if (lowerName.includes("relate") || lowerName.includes("reference")) {
      return "relates";
    }

    return "relates";
  }

  // 測試 API 連線
  async testConnection(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const userData = await this.proxyRequest("/rest/api/3/myself");
      return { success: true, details: userData };
    } catch (error: any) {
      let errorMessage = "連線失敗";
      if (error.message.includes("401")) {
        errorMessage = "認證失敗：請檢查電子郵件和 API Token 是否正確";
      } else if (error.message.includes("403")) {
        errorMessage = "權限不足：請檢查 API Token 權限";
      } else if (error.message.includes("404")) {
        errorMessage = "Jira 網站不存在：請檢查 URL 是否正確";
      } else if (error.message.includes("CORS")) {
        errorMessage = "CORS 錯誤：請確認代理端點正常運作";
      }

      return { success: false, error: errorMessage, details: error.message };
    }
  }

  // 建立 Issue 連結
  async createIssueLink(
    inwardKey: string,
    outwardKey: string,
    linkTypeName: string = "Blocks"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.proxyRequest("/rest/api/3/issueLink", "POST", {
        type: { name: linkTypeName },
        inwardIssue: { key: inwardKey },
        outwardIssue: { key: outwardKey },
      });
      return { success: true };
    } catch (error: any) {
      console.error("建立 Issue 連結失敗:", error);
      return { success: false, error: error.message };
    }
  }

  // 刪除 Issue 連結
  async deleteIssueLink(linkId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.proxyRequest(`/rest/api/3/issueLink/${linkId}`, "DELETE");
      return { success: true };
    } catch (error: any) {
      console.error(`刪除 Issue 連結 ${linkId} 失敗:`, error);
      return { success: false, error: error.message };
    }
  }
}

// 建立 Jira API 客戶端實例的工廠函數
export function createJiraClient(baseUrl: string, email: string, apiToken: string): JiraApiClient {
  return new JiraApiClient({ baseUrl, email, apiToken });
}

// 搜尋 Epic 函數
export async function searchEpicWithJiraApi(
  epicKey: string,
  jiraConfig?: Partial<JiraConfig>
): Promise<EpicSearchResult> {
  if (!jiraConfig?.baseUrl || !jiraConfig?.email || !jiraConfig?.apiToken) {
    throw new Error("Jira API 配置不完整，請在設定中填寫完整的 Jira 網址、Email 與 API Token");
  }

  const client = createJiraClient(jiraConfig.baseUrl, jiraConfig.email, jiraConfig.apiToken);
  return client.searchEpicAndRelatedIssues(epicKey);
}

// 取得 Demo 用的 Epic 與相關卡片關聯資料
export function getDemoEpicData(): EpicSearchResult {
  const epic: JiraCard = {
    id: "EPIC-101",
    key: "EPIC-101",
    summary: "Jira 關聯可視化與管理系統 (Jira Graph Visualization)",
    issueType: "Epic",
    status: "In Progress",
    priority: "High",
    url: "https://demo.atlassian.net/browse/EPIC-101",
    description:
      "本 Epic 旨在建立一個高互動性的 Jira 卡片關聯圖，提供關鍵路徑分析與瓶頸高亮等進階管理功能。",
    sprint: "Sprint 1",
  };

  const relatedCards: JiraCard[] = [
    epic,
    {
      id: "CARD-A",
      key: "CARD-A",
      summary: "Jira API 認證機制整合 (Jira API Auth)",
      issueType: "Story",
      status: "Done",
      priority: "High",
      assignee: "Alice",
      epicLink: "EPIC-101",
      url: "https://demo.atlassian.net/browse/CARD-A",
      description: "實作 Basic 安全認證，確保能安全讀取 Jira 資源。",
      storyPoints: 3,
      sprint: "Sprint 1",
    },
    {
      id: "CARD-B",
      key: "CARD-B",
      summary: "Jira Proxy API 後端轉發端點 (Jira Proxy Backend)",
      issueType: "Tech",
      status: "In Progress",
      priority: "High",
      assignee: "Bob",
      epicLink: "EPIC-101",
      url: "https://demo.atlassian.net/browse/CARD-B",
      description:
        "建立代理端點轉發請求，處理 CORS 限制，並支援 Issue Link 建立與刪除。",
      storyPoints: 5,
      sprint: "Sprint 1",
    },
    {
      id: "CARD-C",
      key: "CARD-C",
      summary: "前端 React Flow 畫布元件與 ELK 佈局 (React Flow Frontend)",
      issueType: "Tech",
      status: "To Do",
      priority: "Medium",
      assignee: "Charlie",
      epicLink: "EPIC-101",
      url: "https://demo.atlassian.net/browse/CARD-C",
      description: "整合 React Flow 與 ELK.js 自動佈局演算法，實現卡片關聯圖表的自動繪製。",
      storyPoints: 8,
      sprint: "Sprint 1",
    },
    {
      id: "CARD-D",
      key: "CARD-D",
      summary: "安全憑證設定與環境隔離調整 (Security & Environment Setup)",
      issueType: "Story",
      status: "Done",
      priority: "Medium",
      assignee: "Dave",
      epicLink: "EPIC-101",
      url: "https://demo.atlassian.net/browse/CARD-D",
      description: "配置測試環境的 HTTPS/SSL 憑證，並設定安全白名單。",
      storyPoints: 2,
      sprint: "Sprint 1",
    },
    {
      id: "CARD-E",
      key: "CARD-E",
      summary: "UI 介面微調與互動動畫優化 (UI Polish & Optimization)",
      issueType: "Story",
      status: "To Do",
      priority: "Low",
      assignee: "Alice",
      epicLink: "EPIC-101",
      url: "https://demo.atlassian.net/browse/CARD-E",
      description: "為節點和邊線添加 Hover 效果，並實作關鍵路徑高亮的脈衝呼吸動畫。",
      storyPoints: 3,
      sprint: "Sprint 1",
    },
    {
      id: "CARD-F",
      key: "CARD-F",
      summary: "使用者權限管理與協作控制 (User Access Management)",
      issueType: "Story",
      status: "To Do",
      priority: "Medium",
      assignee: "Eve",
      epicLink: "EPIC-101",
      url: "https://demo.atlassian.net/browse/CARD-F",
      description: "設定不同使用者對關聯圖的檢視與操作許可權。",
      storyPoints: 5,
      sprint: "Sprint 1",
    },
  ];

  const relations: JiraRelation[] = [
    {
      id: "link-1",
      fromCardId: "CARD-A",
      toCardId: "CARD-B",
      relationType: "blocks",
      description: "blocks: Jira Proxy Backend",
    },
    {
      id: "link-2",
      fromCardId: "CARD-D",
      toCardId: "CARD-B",
      relationType: "is-blocked-by",
      description: "is blocked by: Security & Environment Setup",
    },
    {
      id: "link-3",
      fromCardId: "CARD-B",
      toCardId: "CARD-C",
      relationType: "blocks",
      description: "blocks: React Flow Frontend",
    },
    {
      id: "link-4",
      fromCardId: "CARD-C",
      toCardId: "CARD-E",
      relationType: "blocks",
      description: "blocks: UI Polish & Optimization",
    },
    {
      id: "link-5",
      fromCardId: "CARD-B",
      toCardId: "CARD-F",
      relationType: "relates",
      description: "relates to: User Access Management",
    },
  ];

  return {
    epic,
    relatedCards,
    relations,
  };
}
