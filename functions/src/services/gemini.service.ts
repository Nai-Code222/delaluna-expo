import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateGeminiImage(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;

  const text = response.text();

  // Gemini returns raw SVG text when prompted correctly
  return text.trim();
}