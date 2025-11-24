import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE ?? '5242880', 10), // 5MB
  dest: process.env.UPLOAD_DEST || './uploads',
}));
