
const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs");

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, "bot.log");

function writeLog(level, message, data = null) {
    const timestamp = new Date().toISOString();

    let extra = "";

    if (data) {
        try {
            extra = ` ${JSON.stringify(data)}`;
        } catch (error) {
            extra = ` ${String(data)}`;
        }
    }

    const line = `[${timestamp}] [${level}] ${message}${extra}`;

    console.log(line);

    try {
        fs.appendFileSync(logFile, line + "\n");
    } catch (error) {
        console.error("Failed to write log file:", error.message);
    }
}

function info(message, data = null) {
    writeLog("INFO", message, data);
}

function warn(message, data = null) {
    writeLog("WARN", message, data);
}

function error(message, data = null) {
    writeLog("ERROR", message, data);
}

function debug(message, data = null) {
    writeLog("DEBUG", message, data);
}

module.exports = {
    info,
    warn,
    error,
    debug
};

