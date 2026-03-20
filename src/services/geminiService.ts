import { GoogleGenAI, Modality, Type } from "@google/genai";

const getApiKey = () => {
  return process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface AnalysisResult {
  isFake: boolean;
  riskScore: number;
  reasoning: string;
}

export async function analyzeMessage(content: string, imageBase64?: string): Promise<AnalysisResult> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please add GEMINI_API_KEY to your environment variables or secrets.");
    }

    const prompt = `Analyze the following message and determine if it is a scam or fake. 
    A message is considered FAKE if the risk score is 80% or higher.
    
    Provide a JSON response with:
    - isFake: boolean (true if riskScore >= 80)
    - riskScore: number (0-100)
    - reasoning: string (Provide a short, straightforward, and simple explanation that is very easy to understand. Keep it brief and to the point.)
    
    Message: "${content}"`;

    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64.split(',')[1],
          mimeType: "image/png"
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFake: { type: Type.BOOLEAN },
            riskScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["isFake", "riskScore", "reasoning"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini AI");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function speakText(text: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly and slowly for an elderly person: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return undefined;
  }
}
