import geminiAI from '../config/gemeni.js';
import aiInsightModel from '../models/aiInsightModel.js';
import { sendResponse } from '../utils/sendResponse.js'
import logAudit from '../utils/logAudit.js'



const analyzeFile = async (req, res) => {
    try {
        const { pdfText, reportName, reportType } = req.body;

        if (!pdfText || pdfText.trim().length === 0) {
            return sendResponse(res, 400, "No text provided for analysis");
        }

        if (!reportName || reportName.trim().length === 0) {
            return sendResponse(res, 400, "Report name is required");
        }

        if (!reportType || reportType.trim().length === 0) {
            return sendResponse(res, 400, "Report type is required");
        }

        const prompt = `
Analyze and summarize the following medical report. 
Format the output in HTML so it can be displayed directly in a web page. Use proper headings, paragraphs, and lists.

Requirements:
1. A short summary (use <h2>Summary</h2> and <p>).
2. Key abnormal values or findings (use <h2>Key Findings</h2> and <ul><li>...</li></ul>).
3. A few simple health recommendations (use <h2>Recommendations</h2> and <ul><li>...</li></ul>).
4. Always end with: "<p><strong>Note:</strong> This summary is for understanding only, not for medical advice.</p>"

Report:
<pre>${pdfText}</pre>
`;


        let summaryText = "";
        
        try {
            const response = await geminiAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
            });


            // Try different ways to extract text
            if (response?.text) {
                summaryText = response.text;
            } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                summaryText = response.candidates[0].content.parts[0].text;
            } else if (response?.content?.parts?.[0]?.text) {
                summaryText = response.content.parts[0].text;
            }

        } catch (geminiError) {
            console.error("Gemini API Error:", geminiError.message);
            
            // FALLBACK: Generate mock summary if API key is invalid
            if (geminiError.message.includes("API key") || geminiError.message.includes("INVALID_ARGUMENT")) {
                
                summaryText = `
<h2>Summary</h2>
<p>This is a <strong>DEMO/MOCK SUMMARY</strong> because the Gemini API key is not configured. To enable real AI analysis:</p>
<ol>
  <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
  <li>Get a valid API key</li>
  <li>Update <code>GEMINI_API_KEY</code> in your .env file</li>
  <li>Restart the backend server</li>
</ol>

<h2>Document Analysis</h2>
<p>Report Type: <strong>${reportType}</strong></p>
<p>Report Name: <strong>${reportName}</strong></p>
<p>Text Length: <strong>${pdfText.length} characters</strong></p>

<h2>Key Findings</h2>
<ul>
  <li>Document successfully extracted and processed</li>
  <li>Ready for real AI analysis once API key is configured</li>
  <li>All data is being saved to the database</li>
</ul>

<h2>Recommendations</h2>
<ul>
  <li>Configure a valid Gemini API key for full functionality</li>
  <li>The database integration is working correctly</li>
  <li>You can continue testing the application workflow</li>
</ul>

<p><strong>Note:</strong> This summary is for understanding only, not for medical advice.</p>
`;
            } else {
                // For other errors, return the actual error
                return sendResponse(res, 500, `Gemini API Error: ${geminiError.message}`)
            }
        }

        if (!summaryText) {
            return sendResponse(res, 500, "Failed to generate summary from AI");
        }

        // Save AI summary in database
        const savedInsight = await aiInsightModel.create({
            reportName,
            reportType,
            notes: req.body.notes || "",
            userId: req.user._id,
            aiSummary: summaryText,
            extractedText: pdfText,
        });

        sendResponse(res, 200, "Summary successful", { summery: summaryText })
    } catch (error) {
        console.error("Analyze File Error:", error.message);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
};


const getAllInsights = async (req, res) => {

    try {

        const insights = await aiInsightModel.find({ userId: req.user._id })
            .populate('uploadedBy', 'userName role');

        sendResponse(res, 200, "All insights successful", { insights })
    } catch (error) {
        console.log(error);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const getInsightById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            sendResponse(res, 400, "No id provided");
            return
        }

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return sendResponse(res, 400, "Invalid insight ID format");
        }

        // Filter by both _id and userId to ensure ownership
        const singleInsight = await aiInsightModel.findOne({ 
            _id: id, 
            userId: req.user._id 
        });

        if (!singleInsight) {
            return sendResponse(res, 404, "Insight not found")
        }

        sendResponse(res, 200, "Insight successful", { singleInsight })
    } catch (error) {
        console.error("Get Insight Error:", error.message);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const getPatientInsights = async (req, res) => {
    try {
        const { patientId } = req.params;

        if (!patientId) {
            return sendResponse(res, 400, "Patient ID is required");
        }

        if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
            return sendResponse(res, 400, "Invalid patient ID format");
        }

        const insights = await aiInsightModel.find({ userId: patientId });

        // Audit log: doctor viewed patient insights
        logAudit({ req, action: 'VIEW_PATIENT_INSIGHTS', targetId: patientId, targetType: 'AiInsight' });

        sendResponse(res, 200, "Patient insights retrieved successfully", { insights });
    } catch (error) {
        console.error("Get Patient Insights Error:", error.message);
        sendResponse(res, 500, "Internal server error", { error: error.message });
    }
};

const deleteInsight = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            sendResponse(res, 400, "No id provided");
            return
        }

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return sendResponse(res, 400, "Invalid insight ID format");
        }

        // Delete only if owned by the current user
        const result = await aiInsightModel.deleteOne({ 
            _id: id, 
            userId: req.user._id 
        });

        if (result.deletedCount === 0) {
            return sendResponse(res, 404, "Insight not found or not authorized");
        }

        sendResponse(res, 200, "Deleted Successfully");
    } catch (error) {
        console.error("Delete Insight Error:", error.message);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

export { analyzeFile, getAllInsights, getInsightById, getPatientInsights, deleteInsight }