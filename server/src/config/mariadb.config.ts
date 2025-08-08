import mariadb from "mariadb";

let host;
let port;

if (process.env.IS_DOCKER === "false") {
	host = "localhost";
	port = process.env.DB_PORT_LOCAL ? parseInt(process.env.DB_PORT_LOCAL) : 0;
}
console.log("host", host);
const pool = mariadb.createPool({
	host: host ? host : process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: port ? port : parseInt(process.env.DB_PORT_DOCKER || "3306"),
	connectionLimit: process.env.DB_CONNECTION_LIMIT
		? parseInt(process.env.DB_CONNECTION_LIMIT)
		: 50,
	connectTimeout: 10000,
	socketTimeout: 30000,
	acquireTimeout: 30000,
	compress: true,
	pipelining: true,
	bulk: true,
	bigIntAsNumber: true,
});

console.log({
	host: host ? host : process.env.DB_HOST,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	port: port ? port : parseInt(process.env.DB_PORT_DOCKER || "3306"),
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
