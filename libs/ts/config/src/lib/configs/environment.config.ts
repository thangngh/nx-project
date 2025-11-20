import { registerAs } from "@nestjs/config";

export default registerAs('environment', () => ({
  local: process.env.NODE_ENV === 'local',
  development: process.env.NODE_ENV === 'development',
  staging: process.env.NODE_ENV === 'staging',
  production: process.env.NODE_ENV === 'production',
}))