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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Oops! My magic goggles are a bit blurry. Let's try that again!";
    return {
      isMatch: false,
      identifiedEmotion: "checking",
      message: errorMessage
    };
  }
}
