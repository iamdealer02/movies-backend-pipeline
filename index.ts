import dotenv from 'dotenv';
dotenv.config();
import startApp from './src/boot/setup';
import logger from './src/middleware/winston';

((): void => {
  try {
    startApp();
  } catch (error) {
    logger.error('Error in index.js => startApp');
    logger.error(`Error; ${JSON.stringify(error, undefined, 2)}`);
  }
})();
