import { createClient, RedisClientType } from "redis";

const redisClient: RedisClientType = createClient({
	socket: {
		host: process.env.REDIS_HOST || "localhost",
		port: parseInt(process.env.REDIS_PORT || "6379", 10),
	},
	password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", (err) => {
	console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
	console.log("Connected to Redis");
});

export const connectRedis = async () => {
	if (!redisClient.isOpen) {
		await redisClient.connect();
	}
	return redisClient;
};

export { redisClient };
