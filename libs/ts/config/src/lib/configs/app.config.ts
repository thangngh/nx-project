import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.NEST_APP_PORT ?? '3000', 10),
}));