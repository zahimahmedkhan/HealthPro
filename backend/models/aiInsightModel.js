import mongoose from 'mongoose'

const aiInsightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    aiSummary: {
        type: String,
        required: true,
    },
    extractedText: {
        type: String,
        required: true,
    },
    reportName: {
        type: String,
        required: true
    },
    reportType: {
        type: String, 
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, { timestamps: true })

const aiInsightModel = mongoose.model("aiInsight", aiInsightSchema);

export default aiInsightModel;