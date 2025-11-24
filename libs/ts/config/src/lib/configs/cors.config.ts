import { registerAs } from '@nestjs/config';

export default registerAs('cors', () => ({
  enabled: process.env.CORS_ENABLED === 'true',
  origin: process.env.CORS_ORIGIN || '*',
  methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: process.env.CORS_CREDENTIALS === 'true',
}));
