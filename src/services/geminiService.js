const { GoogleGenerativeAI } = require('@google/generative-ai');

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

/**
 * Service to improve post content using Google Gemini AI
 */
async function improveContentWithGemini({ title, description, content, userInstructions }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not defined in environment variables. Please add your Gemini API key to .env'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
You are an expert editorial AI assistant for Akatsuki's Draft content platform.
Your job is to enhance and polish a user's post to make it more compelling, clear, well-structured, and engaging, while preserving the original meaning and core idea.

Original Post Details:
- Title: ${title || 'Untitled'}
- Description: ${description || 'None'}
- Content: ${content}

${userInstructions ? `Additional User Instructions: ${userInstructions}` : ''}

Please return a valid JSON object strictly matching this schema:
{
  "improvedTitle": "Polished, engaging title",
  "improvedDescription": "A concise, engaging 1-2 sentence summary/description",
  "improvedContent": "The enhanced, beautifully written and structured content (you can use markdown for headings, bullet points, etc. where appropriate)"
}
`;

  let lastError;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const parsed = JSON.parse(responseText);
        return {
          title: parsed.improvedTitle || title,
          description: parsed.improvedDescription || description,
          content: parsed.improvedContent || content,
        };
      } catch (parseErr) {
        return {
          title: title ? `[Enhanced] ${title}` : 'Enhanced Post',
          description: description || 'Enhanced version of original post',
          content: responseText.trim(),
        };
      }
    } catch (err) {
      lastError = err;
      // If 503 or model not found, try next candidate model
      console.warn(`Gemini model ${modelName} encountered: ${err.message}. Trying next candidate...`);
      continue;
    }
  }

  throw new Error(`All Gemini models failed: ${lastError?.message}`);
}

module.exports = {
  improveContentWithGemini,
};
