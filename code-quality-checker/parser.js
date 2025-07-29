require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeCodeQuality(code) {
    const prompt = `
You are a code quality analyzer.
Analyze the following codebase as a whole and provide:
1. A single consolidated quality score from 0 to 100 for the entire codebase.
2. 2-3 specific, concise, and easy-to-understand improvement suggestions for the overall codebase. Be precise and do not elaborate.
3. If the code is not optimized, you may reduce the score and mention optimization in the improvements.

Codebase:
${code}
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([prompt]);
    let text = '';
    if (result && result.response && result.response.candidates && result.response.candidates[0] && result.response.candidates[0].content && result.response.candidates[0].content.parts && result.response.candidates[0].content.parts[0]) {
        text = result.response.candidates[0].content.parts[0].text;
    } else {
        text = JSON.stringify(result.response);
    }

    return {
        score: null, // parse from text if possible
        suggestions: [text],
        raw: text
    };
}

module.exports = { analyzeCodeQuality }; 