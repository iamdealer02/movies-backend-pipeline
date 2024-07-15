import winston from 'winston';
import { winstonOptions } from 'src/interfaces/loggerInterfaces';

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

logger.stream({
  write: function (message: string) {
    logger.info(message);
  },
});

export default logger;
