import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'onairmate.duckdns.org',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  connectTimeout: 60000,
  //lazyConnect: true,
});

redis.on('connect', () => {
  console.log('🔗 Redis connected');
});
redis.on('ready', () => {
  console.log('✅ Redis ready to use');
});
redis.on('error', err => {
  console.error('❌ Redis connection error:', err);
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

export default redis;
