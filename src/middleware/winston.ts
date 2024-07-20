import winston from 'winston';
import { winstonOptions } from '../interfaces/loggerInterfaces';
import morgan from 'morgan';

const options: winstonOptions = {
  file: {
    level: 'info',
    filename: `./logs/app.log`,
    handleExceptions: true,
    maxsize: 5242880, // about 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  },
};

const logger: winston.Logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

export const streamOptions: morgan.StreamOptions = {
  write: (message: string) => {
    logger.info(message);
  },
};

logger.stream(streamOptions);

export default logger;
