/**
 * Simple Logger for Connect Four Server
 */
const LogLevel = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS'
};

const colors = {
    reset: '\x1b[0m',
    info: '\x1b[36m',    // Cyan
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    success: '\x1b[32m'  // Green
};

class Logger {
    format(level, message) {
        const timestamp = new Date().toISOString();
        const color = colors[level.toLowerCase()] || colors.reset;
        return `[${timestamp}] ${color}${level.padEnd(7)}${colors.reset} | ${message}`;
    }

    info(msg) { console.log(this.format(LogLevel.INFO, msg)); }
    warn(msg) { console.warn(this.format(LogLevel.WARN, msg)); }
    error(msg) { console.error(this.format(LogLevel.ERROR, msg)); }
    success(msg) { console.log(this.format(LogLevel.SUCCESS, msg)); }
}

export const logger = new Logger();
