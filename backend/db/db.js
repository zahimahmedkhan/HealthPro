import mongoose from 'mongoose'
import "dotenv/config"
import dns from 'dns'

dns.setServers(['8.8.8.8', '1.1.1.1'])  

const mongoUri =
    process.env.DB_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

let connectionPromise = null;

const ensureDbConnection = async () => {
    if (!mongoUri) {
        throw new Error("Database URL is not configured. Set DB_URL or MONGODB_URI or DATABASE_URL.");
    }

    // 1 = connected, 2 = connecting
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2 && connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
    })
        .then(() => mongoose.connection)
        .catch((error) => {
            connectionPromise = null;
            throw error;
        });

    return connectionPromise;
};

// Warm up connection on module load (best effort for serverless cold starts)
ensureDbConnection().catch((error) => {
    console.error("❌ MongoDB connection warmup error:", error.message);
});

export { ensureDbConnection };
export default mongoose