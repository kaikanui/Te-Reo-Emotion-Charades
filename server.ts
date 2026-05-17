import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for Emotion Analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, targetEmotion, isHintNeeded } = req.body;
      const currentKey = process.env.GEMINI_API_KEY;

      if (!currentKey || currentKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          message: "Gemini API key is missing. Please set it in the Settings > Secrets panel.",
          isMatch: false,
          identifiedEmotion: "error"
        });
      }

      const prompt = isHintNeeded 
        ? `Target: ${targetEmotion.maori}. Hint needed.`
        : `Target: ${targetEmotion.maori}`;

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(",")[1],
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
          systemInstruction: `
            You are an energetic, encouraging classroom game host for an interactive "Te Reo Māori Emotion Charades" game.
            
            TASK:
            1. Analyze the student's facial expression and body language.
            2. Identify the emotion they are currently displaying (e.g., "happy", "confused", "excited", "sad").
            3. Determine if it matches the target Te Reo Māori emotion: ${targetEmotion.maori} (${targetEmotion.english}).
            
            RESPONSE FORMAT (MANDATORY JSON):
            Return ONLY a JSON object with these keys:
            {
              "isMatch": boolean,
              "identifiedEmotion": string (1-2 words),
              "message": string (2-3 enthusiastic sentences)
            }

            GAME LOGIC:
            - If acting MATCHES (isMatch: true):
               - Validate what you see (e.g., "I see your big smile!").
               - Reveal translation: "Ka pai! You nailed it! ${targetEmotion.maori} means ${targetEmotion.english}!"
            - If acting DOES NOT match (isMatch: false):
               - Be supportive. 
               - Identify what they ARE showing: "It looks like you are feeling [identifiedEmotion]!"
               - Give specific advice: "To show ${targetEmotion.maori}, try [advice]."
               - Reveal the translation: "${targetEmotion.maori} means ${targetEmotion.english}."
               
            TONE: Always positive and uplifting.
          `,
          temperature: 0.7,
          responseMimeType: "application/json"
        },
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ 
        message: "Oops! My magic goggles are a bit blurry. Let's try that again!",
        isMatch: false,
        identifiedEmotion: "cloudy"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
