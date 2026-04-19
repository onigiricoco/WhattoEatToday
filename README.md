# 今天吃什么 (What to Eat Today)


智能库存管理和AI食谱推荐助手。这款应用可以帮助您管理厨房库存，实时提醒即将过期的食材，并根据您的现有食材和个人喜好，推荐来自世界各地的美味食谱。

## ✨ 功能

- 🧊 **库存追踪**：管理冰箱、冷冻室和食品储藏室中的物品。

- 🔔 **AI过期提醒**：智能提醒您哪些食材即将过期。

- 🍳 **个性化食谱**：根据您的烹饪水平、烹饪时间和口味量身定制的食谱。

- 🎲 **全球美食**：探索从粤菜到墨西哥菜等各种美食，更有幸运推荐。

- 🌍 **双语支持**：全面支持简体中文和英文。

- 🔒 **安全集成**：服务器端代理可保护您的 Gemini API 密钥免受浏览器访问。

## 🚀 本地运行

### 前提条件

- [Node.js](https://nodejs.org/)（推荐使用最新 LTS 版本）

### 设置

1. **克隆仓库**：

```bash

git clone <你的仓库 URL>

cd <仓库名称>

```

2. **安装依赖项**：

```bash

npm install

```

3. **配置环境变量**：

在根目录下创建 `.env` 文件，并添加你的 Gemini API 密钥：

```env

GEMINI_API_KEY=你的实际密钥

```

*注意：你可以从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取你的密钥。*

4. **启动应用程序**：

```bash

npm run dev

```

应用程序将在以下位置运行`http://localhost:3000`。

## 🚀 部署到 Vercel

本项目已针对 Vercel 部署进行了优化：

1. **推送至 GitHub**：将您的更改推送至您的 GitHub 代码库。

2. **导入到 Vercel**：将代码库导入到您的 [Vercel 控制面板](https://vercel.com/)。

3. **配置环境变量**：

在 Vercel 项目设置中，添加以下环境变量：

- `GEMINI_API_KEY`：您的 Google AI Studio API 密钥。

4. **部署**：Vercel 将自动检测 Vite + Express 设置，并部署前端和无服务器 API 功能。

## 🌐 查看实时演示

您可以在 AI Studio 上与此应用的托管版本进行互动：

[在 AI Studio 中查看应用](https://ai.studio/apps/e928fc9e-5f03-45b2-ae60-318d34bf9e96)

---

*使用 React、Express、Vite 和 Google Gemini Flash 构建。*

Smart inventory management and AI-powered recipe recommendation assistant. This app helps you manage your kitchen inventory, offers real-time reminders for near-expiry ingredients, and suggests delicious recipes from around the world based on what you have and your preferences.


## ✨ Features

- 🧊 **Inventory Tracking**: Manage items in your fridge, freezer, and pantry.
- 🔔 **AI Expiry Alerts**: Get smart reminders for ingredients that need to be used soon.
- 🍳 **Personalized Recipes**: Recipes tailored to your skill level, cooking time, and taste.
- 🎲 **Global Cuisines**: Explore cuisines from Cantonese to Mexican with lucky picks.
- 🌍 **Bilingual Support**: Full support for both Chinese (Simplified) and English.
- 🔒 **Secure Integration**: Server-side proxy keeps your Gemini API key safe from the browser.

## 🚀 Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS recommended)

### Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd <repo-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```
   *Note: You can get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).*

4. **Start the application**:
   ```bash
   npm run dev
   ```
   The app will be running at `http://localhost:3000`.

## 🚀 Deploy to Vercel

This project is optimized for Vercel deployment:

1. **Push to GitHub**: Push your changes to your GitHub repository.
2. **Import to Vercel**: Import the repository into your [Vercel Dashboard](https://vercel.com/).
3. **Configure Environment Variables**:
   In the Vercel project settings, add the following environment variable:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
4. **Deploy**: Vercel will automatically detect the Vite + Express setup and deploy the frontend and serverless API functions.

## 🌐 View Live

You can interact with the hosted version of this app on AI Studio:
[View App in AI Studio](https://ai.studio/apps/e928fc9e-5f03-45b2-ae60-318d34bf9e96)

---

*Built with React, Express, Vite, and Google Gemini Flash.*
