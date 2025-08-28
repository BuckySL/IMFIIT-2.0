// src/utils/logger.js 
import winston from 'winston'; 
 
export const logger = winston.createLogger({ 
  level: 'info', 
  format: winston.format.combine( 
    winston.format.colorize(), 
    winston.format.timestamp({ format: 'HH:mm:ss' }), 
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`) 
  ), 
  transports: [new winston.transports.Console()] 
}); 
