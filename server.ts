/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;
const apiKey = process.env.GEMINI_API_KEY;

// Lazy initialization of the Gemini API client to prevent startup failure if key is unset
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. The chat assistant is running in aesthetic fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Health probe
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', api_configured: !!apiKey });
  });

  // API: ChatGPT conversational proxy using Gemini
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing or invalid messages array' });
      }

      const ai = getAiClient();
      if (!ai) {
        // Return clear instructions if Gemini API key is not configured
        return res.json({
          text: "你好！由于后台未检测到 `GEMINI_API_KEY` 密钥（需要在 Settings 中的 Secrets 面板下进行添加配置），我已经自动切换至 **Atelier 创意沙箱模式**。\n\n你可以照常在各个工作区中对 **极雅日程板** 进行体验。一经添加 API 密钥，我作为您的数字顾问，就能为您开启完全流畅的品牌美学分析与决策建议！🎨✨"
        });
      }

      // Format messages content structure for @google/genai SDK
      // Ensure roles are strictly 'user' or 'model'
      const formattedContents = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: formattedContents,
        config: {
          systemInstruction: "You are the premium digital curator, design director, and strategic companion for the Atelier Workspace Suite. The suite comprises multiple elite components: Atelier Mail, Chronos Kanban, Hermes Calendar, Atelier Ledger, Citadel Key, and Brand Lab. Your persona is highly professional, eloquent, design-centric, polite, and sophisticated. Keep explanations helpful, clean, and formatted elegantly using standard lists and tables. Adjust your language strictly to match the user's inquiry (Chinese or English) and provide high-quality design guidance.",
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Server API gemini error:", err);
      res.status(500).json({ error: err.message || 'Gateway reflection failed' });
    }
  });

  // Incorporate Vite middleware for development or Static Asset routing for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html as fallback for React routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Atelier Full-Stack server is actively running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to bootstrap server container:", err);
});
