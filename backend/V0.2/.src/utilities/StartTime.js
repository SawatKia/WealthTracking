const { formatBkkTime } = require('./Utils');

class ServerTime {
    #startTime;

    /**
     * Initializes a new instance of the ServerTime class, setting the server's start time to the current time.
     */

    constructor() {
        this.#startTime = Date.now();
    }

    /**
     * Gets the start time of the server in milliseconds since the Unix epoch.
     * @returns {number} The start time of the server in milliseconds since the Unix epoch.
     */
    getStartTime() {
        return this.#startTime;
    }

    /**
     * Gets the start time of the server as a formatted string in the format DD/MM/YYYY HH:mm:ss
     * @returns {string} The start time of the server as a formatted string in the format DD/MM/YYYY HH:mm:ss
     */
    getFormattedStartTime() {
        return formatBkkTime(this.#startTime);
    }

    /**
     * Gets the uptime of the server in milliseconds.
     * @returns {number} The uptime of the server in milliseconds.
     */
    getUptime() {
        return Date.now() - this.#startTime;
    }

    /**
     * Formats the uptime in the format <days>d <hours>h <minutes>m <seconds>s.
     * If a unit is 0, it is not shown.
     * @returns {string} The formatted uptime string.
     */
    formatUptime() {
        const seconds = this.getUptime() / 1000;
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

        return parts.join(' ') || `${seconds}s`;
    }
}

module.exports = new ServerTime();