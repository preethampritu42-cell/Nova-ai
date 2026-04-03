import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface Message {
  role: "user" | "model";
  content: string;
  images?: string[]; // base64 strings
}

export async function* sendMessageStream(messages: Message[]) {
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please add it to your secrets.");
  }

  const model = "gemini-3-flash-preview";
  
  // Prepare contents for the API
  const contents = messages.map(msg => {
    const parts: any[] = [{ text: msg.content }];
    if (msg.images) {
      msg.images.forEach(img => {
        const [mimeType, data] = img.split(";base64,");
        parts.push({
          inlineData: {
            mimeType: mimeType.replace("data:", ""),
            data: data
          }
        });
      });
    }
    return { role: msg.role, parts };
  });

  const responseStream = await ai.models.generateContentStream({
    model,
    contents,
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}
