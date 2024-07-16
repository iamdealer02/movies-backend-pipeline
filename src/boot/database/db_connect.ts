import pg from 'pg';
import logger from 'src/middleware/winston';

const db_config: pg.PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 10,
};

let db_connection: pg.Pool;

function startConnection(): void {
  pg.types.setTypeParser(1082, function (stringValue: string): string {
    return stringValue;
  });

  db_connection = new pg.Pool(db_config);

  db_connection.connect((err) => {
    if (!err) {
      logger.info('PostgreSQL Connected');
    } else {
      logger.error('PostgreSQL Connection Failed');
    }
  });

  db_connection.on('error', () => {
    logger.error('Unexpected error on idle client');
    startConnection();
  });
}

startConnection();

export default db_connection;
