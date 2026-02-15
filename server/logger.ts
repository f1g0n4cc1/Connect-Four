/**
 * Simple Logger for Connect Four Server
 */
enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS'
}

const colors = {
    reset: '\x1b[0m',
    info: '\x1b[36m',    // Cyan
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    success: '\x1b[32m'  // Green
};

class Logger {
    private format(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        const color = colors[level.toLowerCase() as keyof typeof colors] || colors.reset;
        return `[${timestamp}] ${color}${level.padEnd(7)}${colors.reset} | ${message}`;
    }

    info(msg: string) { console.log(this.format(LogLevel.INFO, msg)); }
    warn(msg: string) { console.warn(this.format(LogLevel.WARN, msg)); }
    error(msg: string) { console.error(this.format(LogLevel.ERROR, msg)); }
    success(msg: string) { console.log(this.format(LogLevel.SUCCESS, msg)); }
}

export const logger = new Logger();
