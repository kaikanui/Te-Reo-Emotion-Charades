import { FeedbackData, Emotion } from "../types";

export async function analyzeEmotion(
  imageBase64: string,
  targetEmotion: Emotion,
  isHintNeeded: boolean
): Promise<FeedbackData> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageBase64,
        targetEmotion,
        isHintNeeded,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      isMatch: false,
      identifiedEmotion: "acting",
      message: "Oops! My magic goggles are a bit blurry. Let's try that again!"
    };
  }
}
