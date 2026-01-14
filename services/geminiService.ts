
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getWaitTimePrediction = async (
  serviceName: string,
  currentQueueLength: number,
  avgTime: number
): Promise<{ explanation: string; optimizedTip: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Predict wait time and give a smart tip for a queue of ${currentQueueLength} people for "${serviceName}" (avg ${avgTime} mins/person).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING, description: "Friendly explanation of wait time" },
            optimizedTip: { type: Type.STRING, description: "Optimization tip for the user" }
          },
          required: ["explanation", "optimizedTip"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      explanation: "Wait times are currently fluctuating.",
      optimizedTip: "We suggest staying close as your turn might come sooner than expected."
    };
  }
};

export const getAdminAnalytics = async (queueData: any): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this queue data and provide a brief strategic suggestion for staff allocation to reduce wait times: ${JSON.stringify(queueData)}`,
    });
    return response.text || "Keep monitoring real-time flow.";
  } catch (error) {
    return "Staff allocation looks optimal for current traffic.";
  }
};
