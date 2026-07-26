import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CLOUDINARY_PROVIDER } from './cloudinary.provider';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { randomBytes } from 'crypto';

export type ImageCategory = 'avatars' | 'covers' | 'family' | 'documents' | 'timeline' | 'memories' | 'vault';

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface UploadOptions {
  category: ImageCategory;
  transformation?: Record<string, any>;
  folder?: string;
}

const CATEGORY_TRANSFORMATIONS: Record<ImageCategory, Record<string, any>> = {
  avatars: {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto',
  },
  covers: {
    width: 1600,
    height: 500,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  },
  family: {
    width: 800,
    height: 800,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  },
  documents: {
    quality: 'auto',
    format: 'auto',
  },
  timeline: {
    width: 1200,
    height: 800,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  },
  memories: {
    width: 1200,
    height: 800,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  },
  vault: {
    quality: 'auto',
    format: 'auto',
  },
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm', 'application/zip'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    @Inject(CLOUDINARY_PROVIDER)
    private readonly cloudinaryInstance: typeof cloudinary,
  ) {}

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, and WEBP images are allowed');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size must be less than 5MB');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const { category } = options;
    const transformation = {
      ...CATEGORY_TRANSFORMATIONS[category],
      ...options.transformation,
    };

    const folder = `digital-family-tree/${category}`;
    const publicId = `${category}/${randomBytes(16).toString('hex')}`;

    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          transformation,
          overwrite: false,
        },
        (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(new BadRequestException('Image upload failed'));
          }
          if (!result) {
            return reject(new BadRequestException('Image upload failed: no result'));
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  async uploadUserAvatar(buffer: Buffer, userId: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      category: 'avatars',
      transformation: {
        public_id: `avatars/user-${userId}`,
        overwrite: true,
      },
    });
  }

  async uploadUserCover(buffer: Buffer, userId: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      category: 'covers',
      transformation: {
        public_id: `covers/user-${userId}`,
        overwrite: true,
      },
    });
  }

  async uploadFamilyPhoto(buffer: Buffer, familyId: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      category: 'family',
    });
  }

  async uploadMemberAvatar(buffer: Buffer, memberId: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      category: 'avatars',
      transformation: {
        public_id: `avatars/member-${memberId}`,
        overwrite: true,
      },
    });
  }

  async uploadTimeline(buffer: Buffer, familyId: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      category: 'timeline',
    });
  }

  async uploadMemory(buffer: Buffer, familyId: string): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      category: 'memories',
    });
  }

  async uploadVaultDocument(buffer: Buffer, documentId: string, mimeType: string): Promise<UploadResult> {
    const isImage = mimeType.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const folder = 'digital-family-tree/vault';
    const publicId = `vault/${documentId}/${randomBytes(16).toString('hex')}`;

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
      };

      if (isImage) {
        uploadOptions.transformation = {
          quality: 'auto',
          format: 'auto',
        };
      }

      const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
        uploadOptions,
        (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary vault upload failed: ${error.message}`);
            return reject(new BadRequestException('Document upload failed'));
          }
          if (!result) {
            return reject(new BadRequestException('Document upload failed: no result'));
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width || 0,
            height: result.height || 0,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  async uploadImage(buffer: Buffer, category: ImageCategory): Promise<UploadResult> {
    return this.uploadBuffer(buffer, { category });
  }

  async uploadVideo(buffer: Buffer, category: ImageCategory): Promise<UploadResult> {
    const folder = `digital-family-tree/${category}`;
    const publicId = `${category}/${randomBytes(16).toString('hex')}`;

    return new Promise((resolve, reject) => {
      this.cloudinaryInstance.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'video',
          overwrite: false,
        },
        (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary video upload failed: ${error.message}`);
            return reject(new BadRequestException('Video upload failed'));
          }
          if (!result) {
            return reject(new BadRequestException('Video upload failed: no result'));
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width || 0,
            height: result.height || 0,
            bytes: result.bytes,
          });
        },
      ).end(buffer);
    });
  }

  async uploadDocument(buffer: Buffer, category: ImageCategory): Promise<UploadResult> {
    const folder = `digital-family-tree/${category}`;
    const publicId = `${category}/${randomBytes(16).toString('hex')}`;

    return new Promise((resolve, reject) => {
      this.cloudinaryInstance.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'raw',
          overwrite: false,
        },
        (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary document upload failed: ${error.message}`);
            return reject(new BadRequestException('Document upload failed'));
          }
          if (!result) {
            return reject(new BadRequestException('Document upload failed: no result'));
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: 0,
            height: 0,
            bytes: result.bytes,
          });
        },
      ).end(buffer);
    });
  }

  async deleteByPublicId(publicId: string): Promise<void> {
    if (!publicId) return;

    try {
      await this.cloudinaryInstance.uploader.destroy(publicId);
      this.logger.log(`Deleted Cloudinary image: ${publicId}`);
    } catch (error: any) {
      this.logger.warn(`Failed to delete Cloudinary image ${publicId}: ${error.message}`);
    }
  }

  extractPublicIdFromUrl(url: string): string | null {
    if (!url) return null;

    const cloudinaryPattern = /\/v\d+\/(.+?)(?:\.\w+)?$/;
    const match = url.match(cloudinaryPattern);
    if (match) {
      return match[1];
    }

    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex + 1 < parts.length) {
        const relevantParts = parts.slice(uploadIndex + 1);
        const lastPart = relevantParts[relevantParts.length - 1];
        const ext = lastPart.includes('.') ? lastPart.split('.').pop() : null;
        if (ext) {
          relevantParts[relevantParts.length - 1] = lastPart.replace(`.${ext}`, '');
        }
        return relevantParts.join('/');
      }
    }

    return null;
  }

  generateSignedUrl(publicId: string, expiresIn: number = 3600): string {
    return this.cloudinaryInstance.url(publicId, {
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
  }
}
