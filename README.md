# 🗺️ Jira Dependency Graph & Critical Path Visualizer

> 一款專為敏捷軟體研發團隊設計的現代化 Jira 卡片拓撲依賴分析與關鍵路徑（Critical Path）視覺化工具。

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers_%26_Static_Assets-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📖 專案背景與痛點解決

在大型產品研發或複雜 Epic 交付過程中，敏捷團隊常面臨以下挑戰：
1. **依賴關係黑盒子**：Jira 原生介面僅能以單張卡片的清單列出 Blocked / Blocks，難以俯瞰多個跨專案、跨團隊卡片間的深層網狀依賴。
2. **交付延遲風險盲區**：無法直觀找出哪條卡片鏈是「阻礙最終交付的最大瓶頸」（關鍵路徑）。
3. **跨域 CORS 與隱私考量**：傳統方案需要建立第三方後端資料庫存儲企業 Jira Token，帶來嚴重的資安合規風險。

**Jira Dependency Graph** 透過純客戶端拓撲計算結合 Cloudflare 邊緣技術，提供**秒級載入、零伺服器存儲憑證、自動拓撲排版與關鍵路徑呼吸動畫標註**的完整解決方案。

---

## ✨ 核心特色

### 1. 🎯 自動階層化 DAG 拓撲佈局
- 採用 **ELK.js (Eclipse Layout Kernel)** 演算法，將網狀的卡片關聯自動排列為乾淨、分層的單向無環圖（DAG）。
- 清楚展示 Epic、Story、Tech Task、Bug 之間的上下游依賴走向。

### 2. ⚡ 關鍵路徑與瓶頸智慧分析 (Critical Path Analysis)
- **長阻塞鏈高亮**：自動遍歷 DAG 圖形，計算出阻礙最終卡片完成的最長關鍵鏈條（Critical Path），並以動態脈衝呼吸動畫顯眼標示。
- **依賴瓶頸自動警示**：智慧標記入度或出度 $\ge 2$ 的核心節點，提醒主管與工程團隊優先解除特定技術阻塞。

### 3. 🔍 多維度即時過濾與互動
- **類型與指派者篩選**：可依負責人、Sprint、卡片類型、關閉狀態進行即時過濾。
- **孤立卡片與 Won't Fix 隱藏**：一鍵剔除未關聯卡片與已取消卡片，保持圖表聚焦。
- **Story Points 自動匯總**：動態統計當前視圖中的點數總量與完成進度。

### 4. 🛡️ 零信任資安架構 (Bring Your Own Credentials, BYOC)
- **純本地存儲**：Jira 網址、Email 與 API Token 僅保存在使用者瀏覽器的 `localStorage`，重新整理不遺失，清除快取即銷毀。
- **嚴格唯讀 (Read-Only)**：僅呼叫 Jira REST API 查詢關聯拓撲，絕不執行任何卡片建立、修改或刪除。
- **無狀態邊緣代理**：透過 Cloudflare 邊緣無伺服器架構轉發 Jira REST API，消除瀏覽器原生 CORS 限制，**記憶體即發即丟，不留存任何資料庫紀錄與機密 Log**。

---

## 🏗️ 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Client)                      │
│                                                             │
│   [ React 18 + Tailwind CSS ] ── [ ReactFlow Canvas ]       │
│                │                             │              │
│                ▼                             ▼              │
│       localStorage (BYOC)          ELK.js Layout Engine     │
│       (baseUrl, email, token)      (DAG & Critical Path)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS POST (Encrypted)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Cloudflare Edge (Workers + Assets)              │
│                                                             │
│          /api/jira/proxy (Stateless Reverse Proxy)          │
│                │                                            │
│                │ Basic Auth Forwarding (In-Memory Only)     │
└────────────────┼────────────────────────────────────────────┘
                 │ HTTPS (TLS 1.3)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 Atlassian Jira Cloud REST API               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 本地開發指南

### 環境需求
- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0

### 安裝與啟動
```bash
# 1. 複製儲存庫
git clone https://github.com/YuLinChen83/jira-dependency-graph.git
cd jira-dependency-graph

# 2. 安裝相依套件
pnpm install

# 3. 啟動本機開發伺服器 (包含本地端 CORS 代理中繼)
pnpm dev
```
啟動完成後，開啟瀏覽器訪問 `http://localhost:5173`。

### 建置專案
```bash
pnpm build
```
打包檔案將生成至 `dist/` 目錄。

---

## ☁️ 部署至 Cloudflare

本專案原生支援 Cloudflare 最新推薦的 **Workers + Static Assets** 一體化架構（享有全球 Anycast CDN 與免費邊緣運算）：

1. 將專案推送到 GitHub。
2. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)，至 **Workers & Pages** -> **Create application**。
3. 選擇 **Connect to Git** 並關聯本儲存庫。
4. 設定建置指令：
   - **Build command**: `pnpm build`
   - **Deploy command**: `npx wrangler deploy`
5. 點擊 **Save and Deploy**，即可在 1 分鐘內完成全球部署並獲取專屬網址！

---

## 🔑 如何取得 Atlassian Jira API Token

1. 登入您的 [Atlassian 帳戶安全中心](https://id.atlassian.com/manage-profile/security/api-tokens)。
2. 點選 **Create API token**，自訂 Label 後建立。
3. 複製產生的 Token。
4. 開啟本系統，點擊右上角「齒輪」設定按鈕（未設定時顯示醒目的琥珀色提示按鈕），輸入您的：
   - **Jira 網站 URL**（如 `https://yourcompany.atlassian.net`）
   - **帳號 Email**
   - **API Token**
5. 點擊「測試連線」驗證無誤後「儲存設定」即可開始探索卡片關聯！

---

## 🛠️ 技術棧一覽

| 類別 | 技術 / 套件 | 說明 |
| :--- | :--- | :--- |
| **核心框架** | React 18, TypeScript | 高效能組件化與嚴格型別安全 |
| **圖表與畫布** | React Flow | 高度可客製化的節點連線畫布 |
| **拓撲引擎** | ELK.js (Eclipse Layout Kernel) | 自動計算分層有向圖佈局 |
| **樣式設計** | Tailwind CSS, Lucide React | 原子化響應式 UI 與精緻圖標庫 |
| **建置工具** | Vite 5 | 極速 HMR 與生產環境最佳化打包 |
| **雲端部署** | Cloudflare Workers / Static Assets | 邊緣靜態託管與無狀態 CORS 代理 |

---

## 📄 License

本專案採用 [MIT License](LICENSE) 授權開源。
