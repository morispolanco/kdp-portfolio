import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface QualityAnalysis {
  score: number;
  reasoning: string;
}

export const analyzeBookQuality = async (
  title: string,
  genre: string,
  synopsis: string,
  firstChapter: string
): Promise<QualityAnalysis> => {
  if (!synopsis && !firstChapter) {
    throw new Error("Please provide a synopsis or a first chapter for analysis.");
  }

  const prompt = `
    Act as a strict, world-class literary agent and editor. 
    Analyze the following book materials to determine its commercial potential and writing quality.
    
    Book Title: ${title}
    Genre: ${genre}
    
    Synopsis:
    ${synopsis}
    
    First Chapter Excerpt:
    ${firstChapter.substring(0, 3000)} ${firstChapter.length > 3000 ? "...(truncated)" : ""}

    Task:
    Rate the book's quality on a scale of 1 to 10 (integers only).
    1 = Unpublishable / Poor quality.
    5 = Average / Standard self-published quality.
    8 = High quality / Professional.
    10 = Bestseller / Masterpiece.

    Provide a short, 2-sentence reasoning for the score.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "The quality score from 1 to 10" },
            reasoning: { type: Type.STRING, description: "Brief explanation of the score" }
          },
          required: ["score", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as QualityAnalysis;
    
    // Ensure bounds
    result.score = Math.max(1, Math.min(10, result.score));
    
    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback or rethrow
    throw error;
  }
};
