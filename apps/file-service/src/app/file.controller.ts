import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileService } from './file.service.ts';

@Controller('api/v1/files')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.upload(file);
  }

  @Post('upload/:bucket')
  @UseInterceptors(FileInterceptor('file'))
  async uploadToBucket(
    @Param('bucket') bucket: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.upload(file, { bucket });
  }

  @Get(':bucket/:objectName(*)')
  async download(
    @Param('bucket') bucket: string,
    @Param('objectName') objectName: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.fileService.download(bucket, objectName);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.size);
      res.setHeader('Content-Disposition', `attachment; filename="${objectName.split('/').pop()}"`);

      result.stream.pipe(res);
    } catch (error) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':bucket/:objectName(*)')
  async delete(
    @Param('bucket') bucket: string,
    @Param('objectName') objectName: string,
  ) {
    await this.fileService.delete(bucket, objectName);
    return { message: 'File deleted successfully' };
  }

  @Get(':bucket/:objectName(*)/info')
  async getInfo(
    @Param('bucket') bucket: string,
    @Param('objectName') objectName: string,
  ) {
    return this.fileService.getInfo(bucket, objectName);
  }

  @Get(':bucket/:objectName(*)/presigned')
  async getPresignedUrl(
    @Param('bucket') bucket: string,
    @Param('objectName') objectName: string,
    @Query('expiry') expiry?: string,
  ) {
    const expirySeconds = expiry ? parseInt(expiry, 10) : 3600;
    const url = await this.fileService.getPresignedUrl(bucket, objectName, expirySeconds);
    return { url, expiresIn: `${expirySeconds}s` };
  }

  @Get(':bucket/:objectName(*)/thumbnail')
  async getThumbnail(
    @Param('bucket') bucket: string,
    @Param('objectName') objectName: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.fileService.getThumbnail(bucket, objectName);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.size);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      res.send(result.buffer);
    } catch (error) {
      throw new HttpException('Failed to generate thumbnail', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

@Controller('api/v1/buckets')
export class BucketsController {
  constructor(private readonly fileService: FileService) { }

  @Get()
  async listBuckets() {
    const buckets = await this.fileService.listBuckets();
    return { buckets };
  }

  @Get(':bucket/objects')
  async listObjects(
    @Param('bucket') bucket: string,
    @Query('prefix') prefix?: string,
  ) {
    const objects = await this.fileService.listObjects(bucket, prefix);
    return { objects };
  }
}
