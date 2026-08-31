import geminiAI from '../config/gemeni.js'

const AISummery = async (question) => {
    try {
        const response = await geminiAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [{ text: question }]
                }
            ],
        });

        // Extract text from response
        if (response?.text) {
            return response.text;
        } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return response.candidates[0].content.parts[0].text;
        }
        
        return null;
    } catch (error) {
        console.error("AI Summary Error:", error.message);
        throw error
    }
}

export { AISummery }