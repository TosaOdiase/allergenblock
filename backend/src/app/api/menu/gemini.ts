import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ✅ Recommended: Export the model only if you need it directly elsewhere
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function summarizeMenuItems(items: string[]): Promise<string> {
  if (!items || items.length === 0) {
    return 'No menu items available to summarize.';
  }

  const prompt = `You are a helpful assistant. Categorize and summarize the following menu items by type (e.g., appetizers, entrees, desserts, drinks), and make it easy for users with food allergies to understand:\n\n${items.join('\n')}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('❌ Gemini summary generation failed:', error);
    return 'Unable to summarize menu items at this time.';
  }
}
