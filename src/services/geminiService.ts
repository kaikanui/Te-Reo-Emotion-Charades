import { GoogleGenAI } from "@google/genai";
import { Emotion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

import { FeedbackData } from "../types";

export async function analyzeEmotion(
  imageBase64: string,
  targetEmotion: Emotion,
  isHintNeeded: boolean
): Promise<FeedbackData> {
  const prompt = isHintNeeded 
    ? `Target: ${targetEmotion.maori}. Hint needed.`
    : `Target: ${targetEmotion.maori}`;

  const systemInstruction = `
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
    - If acting DOES NOT match OR prompt says "Hint needed" (isMatch: false):
       - Be supportive. 
       - Identify what they ARE showing: "It looks like you are feeling [identifiedEmotion]!"
       - Give specific advice on what to change: "To show ${targetEmotion.maori} (${targetEmotion.english}), try [specific facial adjustment advice]."
       - Reveal the translation: "${targetEmotion.maori} actually means ${targetEmotion.english}."
       
    TONE: Always positive and uplifting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(",")[1],
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json"
      },
    });

    const result = JSON.parse(response.text);
    return {
      isMatch: !!result.isMatch,
      identifiedEmotion: result.identifiedEmotion || "doing great",
      message: result.message || "Keep going! You're doing awesome!"
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      isMatch: false,
      identifiedEmotion: "acting",
      message: "Oops! My magic goggles are a bit blurry. Let's try that again!"
    };
  }
}
