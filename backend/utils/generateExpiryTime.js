const generateJWTExpiryTime = (time) => {
    const unit = time.slice(-1);
    const value = parseInt(time.slice(0, -1), 10);

    if (unit === "s") return value;
    if (unit === "m") return value * 60;
    if (unit === "h") return value * 3600;
    if (unit === "d") return value * 86400;

    throw new Error("Invalid time format");
};

const generateExpiryTime = (time) => {
    const unit = time.slice(-1);
    const value = parseInt(time.slice(0, -1), 10);

    if (isNaN(value) || value <= 0) {
        throw new Error("Invalid time value");
    }

    let milliseconds;

    if (unit === "s") milliseconds = value * 1000;
    else if (unit === "m") milliseconds = value * 60 * 1000;
    else if (unit === "h") milliseconds = value * 60 * 60 * 1000;
    else if (unit === "d") milliseconds = value * 24 * 60 * 60 * 1000;
    else throw new Error("Invalid time unit. Use s, m, h, or d");

    return new Date(Date.now() + milliseconds);
};

export { generateJWTExpiryTime, generateExpiryTime }