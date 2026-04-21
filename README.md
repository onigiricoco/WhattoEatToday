# 今天吃什么 (What to Eat Today)

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
