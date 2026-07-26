import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, Body, Param, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('event-media/:eventId')
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/quicktime', 'video/webm',
        'audio/mpeg', 'audio/wav',
      ];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`File type ${file.mimetype} not allowed for media`), false);
      }
    },
  }))
  async uploadEventMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('eventId') eventId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.uploadService.uploadEventMediaFiles(files, eventId);
  }

  @Post('event-document/:eventId')
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'text/plain',
      ];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`File type ${file.mimetype} not allowed for documents`), false);
      }
    },
  }))
  async uploadEventDocument(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('eventId') eventId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.uploadService.uploadEventDocumentFiles(files, eventId);
  }

  @Post('generic')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async uploadGeneric(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.uploadService.uploadGeneric(file);
  }

  @Post('delete')
  async deleteFile(@Body() body: { url: string }) {
    return this.uploadService.deleteFile(body.url);
  }
}
