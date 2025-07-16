import mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();

const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
	connectionLimit: process.env.DB_CONNECTION_LIMIT
		? parseInt(process.env.DB_CONNECTION_LIMIT)
		: 50,
	connectTimeout: 10000,
	socketTimeout: 30000,
	acquireTimeout: 30000,
	compress: true,
	pipelining: true,
	bulk: true,
});

export default pool;
