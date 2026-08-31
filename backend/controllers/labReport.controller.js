import geminiAI from '../config/gemeni.js';
import aiInsightModel from '../models/aiInsightModel.js';
import { sendResponse } from '../utils/sendResponse.js';
import logAudit from '../utils/logAudit.js';

const uploadReportForPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { pdfText, reportName, reportType, notes } = req.body;

        if (!patientId) {
            return sendResponse(res, 400, 'Patient ID is required');
        }

        if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
            return sendResponse(res, 400, 'Invalid patient ID format');
        }

        if (!pdfText || pdfText.trim().length === 0) {
            return sendResponse(res, 400, 'No text provided for analysis');
        }

        if (!reportName || reportName.trim().length === 0) {
            return sendResponse(res, 400, 'Report name is required');
        }

        if (!reportType || reportType.trim().length === 0) {
            return sendResponse(res, 400, 'Report type is required');
        }

        // Reuse the exact same Gemini prompt and logic from ai.controller.js analyzeFile
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

        let summaryText = '';

        try {
            const response = await geminiAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
            });

            if (response?.text) {
                summaryText = response.text;
            } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                summaryText = response.candidates[0].content.parts[0].text;
            } else if (response?.content?.parts?.[0]?.text) {
                summaryText = response.content.parts[0].text;
            }
        } catch (geminiError) {
            console.error('Gemini API Error:', geminiError.message);

            // FALLBACK: Generate mock summary if API key is invalid
            if (geminiError.message.includes('API key') || geminiError.message.includes('INVALID_ARGUMENT')) {
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
                return sendResponse(res, 500, `Gemini API Error: ${geminiError.message}`);
            }
        }

        if (!summaryText) {
            return sendResponse(res, 500, 'Failed to generate summary from AI');
        }

        // Save AI insight — userId is the PATIENT (not the lab), uploadedBy is the LAB
        const savedInsight = await aiInsightModel.create({
            reportName,
            reportType,
            notes: notes || '',
            userId: patientId,
            aiSummary: summaryText,
            extractedText: pdfText,
            uploadedBy: req.user._id,
        });

        // Audit log: lab uploaded report for patient
        logAudit({
            req,
            action: 'LAB_UPLOAD_REPORT',
            targetId: patientId,
            targetType: 'AiInsight',
            metadata: { reportName, reportType },
        });

        sendResponse(res, 200, 'Report uploaded and analyzed successfully', {
            insight: savedInsight,
            summery: summaryText,
        });
    } catch (error) {
        console.error('Lab Upload Report Error:', error.message);
        sendResponse(res, 500, 'Internal server error', { error: error.message });
    }
};

export { uploadReportForPatient };
