# Jira 卡片關聯與關鍵路徑可視化工具 (Jira Dependency Graph)

一個專為軟體研發團隊設計的 Jira 卡片關聯視覺化與關鍵路徑分析工具。基於 **React 18**、**React Flow** 與 **ELK.js** 佈局引擎，支援 Epic 關聯樹狀拓撲、依賴瓶頸分析與進階篩選功能。

---

## 🌟 核心特色

- 🎯 **自動拓撲佈局**：基於 ELK.js 自動分層演算法，清晰展示 Epic、Story、Tech、Bug 卡片流向。
- ⚡ **關鍵路徑與瓶頸分析 (Critical Path)**：
  - 自動偵測阻塞鏈條（Longest Blocker Path），並以脈衝呼吸動畫高亮顯示。
  - 自動標記依賴瓶頸節點（入度或出度 $\ge 2$ 的卡片）。
- 🔍 **多維度進階篩選**：支援依卡片類型、負責人、Sprint、關鍵字、Won't Fix 與孤立卡片即時過濾。
- 📊 **Story Points 即時統計**：自動統計當前視圖中的卡片點數與狀態進度。

---

## 🛡️ 資安與隱私防護 (BYOC 架構)

本專案採 **BYOC (Bring Your Own Credentials)** 純客戶端模式：
- **零資料庫、零服務端儲存**：您的 Jira 網址、Email 與 API Token 僅保存在您瀏覽器的 `localStorage` 中。
- **無狀態邊緣代理**：Cloudflare Pages Functions / 本地開發中繼僅做無狀態請求轉發（用於消除瀏覽器 CORS 限制），轉發完成即銷毀，不記錄任何帳密於 Log。
- **原始碼徹底脫敏**：專案不包含任何企業內部 Domain、電子郵件或寫死金鑰。

---

## 🚀 本地開發與執行

### 1. 安裝相依套件
```bash
pnpm install
```

### 2. 啟動開發伺服器
```bash
pnpm dev
```
> 開發伺服器內建 API 代理中繼，直接支援本機發送 Jira API 請求，無需額外啟動後端服務。

### 3. 編譯與預覽
```bash
pnpm build
pnpm preview
```

---

## ☁️ 部署至 Cloudflare Pages (免費發布指南)

本專案架構天然適配 **Cloudflare Pages + Pages Functions**（享有全球 CDN 加速與每日 100,000 次免費邊緣請求）：

1. **建立 GitHub 儲存庫**：
   將本專案推送到您的 GitHub（Public 或 Private 倉庫皆可）。

2. **在 Cloudflare Dashboard 建立專案**：
   - 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
   - 點選左側 **Workers & Pages** -> **Create application** -> **Pages**。
   - 選擇 **Connect to Git** 並選取本專案倉庫。

3. **建置設定 (Build Settings)**：
   - **Framework preset**：`Vite`
   - **Build command**：`pnpm build`
   - **Build output directory**：`dist`
   - **Root directory**：`/`

4. **點擊「Save and Deploy」**：
   Cloudflare 將自動編譯前端並佈署 `functions/api/jira/proxy.ts` 邊緣端點，約 1 分鐘即可取得專屬網址（例如 `https://your-jira-graph.pages.dev`）。

---

## 🔑 如何取得 Atlassian Jira API Token

1. 登入您的 Atlassian 帳戶。
2. 前往 [Atlassian API Tokens 管理頁面](https://id.atlassian.com/manage-profile/security/api-tokens)。
3. 點選 **Create API token**，設定標籤並建立。
4. 複製產生的 Token，點擊本工具右上角「齒輪」設定填入即可。

---

## 📄 License
MIT License
