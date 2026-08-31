import fs from "fs-extra";
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const uploadFileToCloudinary = async (fileInput) => {
    try {
        console.log("📤 Upload started:", typeof fileInput); // Debug log
        
        if (!fileInput) {
            throw new Error("No file input provided");
        }

        let publicFile;

        // Check if input is a Buffer (from memory storage)
        if (Buffer.isBuffer(fileInput)) {
            console.log("✅ Uploading buffer to Cloudinary");
            publicFile = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "HealthPro_Images",
                        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
                    },
                    (error, result) => {
                        if (error) {
                            console.error("❌ Cloudinary stream error:", error);
                            reject(error);
                        } else {
                            console.log("✅ Cloudinary upload success:", result.secure_url);
                            resolve(result);
                        }
                    }
                );

                const readableStream = Readable.from(fileInput);
                readableStream.pipe(uploadStream);
            });
        } 
        // Check if input is a file path (string)
        else if (typeof fileInput === 'string') {
            console.log("✅ Uploading file from path:", fileInput);
            
            // Check if file exists
            if (!fs.existsSync(fileInput)) {
                throw new Error(`File not found: ${fileInput}`);
            }
            
            publicFile = await cloudinary.uploader.upload(fileInput, {
                folder: "HealthPro_Images",
            });
            
            console.log("✅ Cloudinary upload success:", publicFile.secure_url);

            // Remove local file after upload
            fs.removeSync(fileInput);
        } else {
            throw new Error(`Invalid file input type: ${typeof fileInput}`);
        }

        if (!publicFile) {
            throw new Error('Upload failed - no result from Cloudinary');
        }

        return publicFile;
    } catch (error) {
        console.error("❌ Cloudinary Upload Error:", error.message);
        
        // Clean up file if it exists and upload failed
        if (typeof fileInput === 'string' && fs.existsSync(fileInput)) {
            fs.removeSync(fileInput);
        }
        
        throw error;
    }
}

const removeFileFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            return;
        }

        const status = await cloudinary.uploader.destroy(publicId, {
            folder: "HealthPro_Images",
        });

        return status;
    } catch (error) {
        console.error("❌ Cloudinary Delete Error:", error);
        throw error;
    }
}

export { uploadFileToCloudinary, removeFileFromCloudinary };