import jwt from 'jsonwebtoken'
import "dotenv/config"
import { generateJWTExpiryTime } from './generateExpiryTime.js';


const generateAccessToken = (expiryTime, userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: generateJWTExpiryTime(expiryTime) });
}

const generateRefreshToken = (expiryTime, userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: generateJWTExpiryTime(expiryTime) });
}

export { generateAccessToken, generateRefreshToken };