const fs = require("fs");
const path = require("path");
const util = require("util");

const logFilePath = path.join(__dirname, "consoleLog.txt");
const logStream = fs.createWriteStream(logFilePath, { flags: "a" }); // flags: 'a' mevcut dosyanın sonuna ekleme yapar
const logToStream = util.format.bind(util);

const originalConsoleLog = console.log;
console.log = (...args) => {
  const now = new Date().toISOString();
  const logMessage = logToStream(...args);
  const logWithDate = `${now}: ${logMessage}\n`;
  originalConsoleLog(...args);
  logStream.write(logWithDate);
};
const originalConsoleError = console.error;
console.error = (...args) => {
  const now = new Date().toISOString();
  const logMessage = logToStream(...args);
  const logWithDate = `${now} ERROR: ${logMessage}\n`;
  originalConsoleError(...args);
  logStream.write(logWithDate);
};
function writeToLog(...args) {
    const now = new Date().toISOString();
    const logMessage = logToStream(...args);
    const logWithDate = `${now}: ${logMessage}\n`;
    logStream.write(logWithDate);
}
process.on("unhandledRejection", (reason, promise) => {
  writeToLog(
    "UNHANDLED REJECTION:",
    reason instanceof Error ? reason.stack : reason
  );
});

process.on("uncaughtExceptionMonitor", (error) => {
  writeToLog("UNCAUGHT EXCEPTION MONITOR:", error.stack || error);
});

process.on("uncaughtException", (error) => {
  writeToLog("UNCAUGHT EXCEPTION:", error.stack || error);
});

process.on("warning", (warning) => {
  writeToLog("WARNING:", warning.stack || warning);
});
process.on("exit", () => {
  logStream.end();
});
