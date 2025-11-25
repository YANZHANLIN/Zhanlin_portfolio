import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateProjectResponse = async (
  query: string,
  projectContext: string,
  chatHistory: ChatMessage[]
): Promise<string> => {
  if (!apiKey) {
    return "Demo Mode: API Key missing. Please configure your environment.";
  }

  try {
    // Format history for context (simplified)
    const historyText = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    
    const systemPrompt = `
      You are an AI Architect Assistant for the portfolio of ZHANLIN.
      You are currently discussing the project described as: "${projectContext}".
      
      Style/Tone:
      - Futuristic, professional, slightly avant-garde, yet helpful.
      - Use concise, clean language similar to a high-tech interface.
      - If the user asks about yourself, identify as "ZHANLIN's Portfolio AI".
      
      Task:
      - Answer the user's question specifically regarding this project.
      - If the question is unrelated to architecture or this project, politely steer it back.
      
      Conversation History:
      ${historyText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: `User Question: ${query}` }
          ]
        }
      ]
    });

    return response.text || "I am analyzing the schematic data... (No response generated)";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Communication with the Neural Net interrupted.";
  }
};