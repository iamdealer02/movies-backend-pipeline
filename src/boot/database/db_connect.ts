import pg from 'pg';
import logger from '../../middleware/winston';
import dotenv from 'dotenv';

dotenv.config();
const isTestEnv = process.env.NODE_ENV === 'test';

let db_config: pg.PoolConfig;
if (isTestEnv && process.env.TEST_DB_URI) {
  db_config = {
    connectionString: process.env.TEST_DB_URI,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else {
  db_config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
    max: 10,
    ssl: process.env.SSL === 'false' ? false : { rejectUnauthorized: false },
  };
}

let db_connection: pg.Pool;

function startConnection(): void {
  pg.types.setTypeParser(1082, (stringValue: string): string => {
    return stringValue;
  });

  db_connection = new pg.Pool(db_config);

  db_connection.connect((err, client) => {
    if (err) {
      logger.error('PostgreSQL Connection Failed', {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    } else {
      logger.info('PostgreSQL Connected');
    }
    client.release();
  });

  db_connection.on('error', (err) => {
    logger.error('Unexpected error on idle client', {
      error: err.message,
      stack: err.stack,
    });
    startConnection();
  });
}

startConnection();

export default db_connection;