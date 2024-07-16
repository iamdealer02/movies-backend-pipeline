import winston from 'winston';

interface winstonOptions extends winston.LoggerOptions {
  file: winston.transports.FileTransportOptions;
  console: winston.transports.ConsoleTransportOptions;
}

export { winstonOptions };
