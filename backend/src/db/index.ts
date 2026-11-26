import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { parse } from 'url';

dotenv.config();

// Expect DATABASE_URL like: mysql://user:pass@host:port/database
const databaseUrl = process.env.DATABASE_URL || '';

let pool: mysql.Pool;
if (databaseUrl) {
  // Use URL parsing to extract parts
  try {
    const parsed = parse(databaseUrl);
    const [user, password] = (parsed.auth || ':').split(':');
    const host = parsed.hostname || '127.0.0.1';
    const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    const database = (parsed.pathname || '').replace(/^\//, '') || process.env.DB_NAME;

    pool = mysql.createPool({
      host,
      port,
      user: user || process.env.DB_USER,
      password: password || process.env.DB_PASSWORD,
      database,
      waitForConnections: true,
      connectionLimit: 10,
    });
  } catch (err) {
    throw new Error(`Invalid DATABASE_URL: ${err}`);
  }
} else {
  // Fallback to individual env vars
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'notes',
    waitForConnections: true,
    connectionLimit: 10,
  });
}

const db = {
  query: async (sql: string, params?: any[]) => {
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  transaction: async <T>(work: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

export default db;