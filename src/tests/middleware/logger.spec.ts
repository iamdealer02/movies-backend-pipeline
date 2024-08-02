// logger.test.ts

import { createLogger, format, transports } from 'winston';
import logger, { streamOptions } from '../../middleware/winston';

jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    json: jest.fn(),
  };
  const mockTransports = {
    Console: jest.fn(),
    File: jest.fn(),
  };
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    stream: jest.fn(),
  };
  return {
    format: mockFormat,
    transports: mockTransports,
    createLogger: jest.fn(() => mockLogger),
  };
});

describe('Logger middleware unit testing', () => {
  const testMessage = 'Logger Testing';

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should call winston methods during logging', () => {
    logger.info(testMessage);

    // Checking if format combine and timestamp are called (once in the console and once in the file)
    expect(format.combine).toHaveBeenCalledTimes(2);
    expect(format.timestamp).toHaveBeenCalledTimes(2);
    expect(transports.Console).toHaveBeenCalledTimes(1);

    // These are the file options that are passed when creating the logger and here 'format' is undefined since it has been mocked above
    expect(transports.File).toHaveBeenCalledWith({
      filename: './logs/app.log',
      level: 'info',
      handleExceptions: true,
      maxsize: 5242880,
      maxFiles: 5,
      format: undefined,
    });

    // checking if createLogger is called
    expect(createLogger).toHaveBeenCalledTimes(1);
  });

  it('should use streamOptions to log messages via logger.info', () => {
    // writing to the stream using streamOptions
    streamOptions.write(testMessage);

    // Expect that logger.info was called with the above test message
    expect(logger.info).toHaveBeenCalledWith(testMessage);
  });
});
