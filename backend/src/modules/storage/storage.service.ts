import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import axios from 'axios';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private isConfigured = false;
  private telnyxApiKey: string;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('storage.cloudinaryCloudName');
    const apiKey = this.configService.get<string>('storage.cloudinaryApiKey');
    const apiSecret = this.configService.get<string>('storage.cloudinaryApiSecret');

    // Store Telnyx API key for authenticated image downloads
    this.telnyxApiKey = this.configService.get<string>('telnyx.apiKey') || '';

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary storage service initialized');
    } else {
      this.logger.warn('Cloudinary credentials not configured - image storage disabled');
    }
  }

  /**
   * Check if a URL is a Telnyx media URL that requires authentication
   */
  private isTelnyxUrl(url: string): boolean {
    return url.includes('telnyx.com') || url.includes('telnyx-mms');
  }

  /**
   * Download an image from Telnyx with authentication
   */
  private async downloadTelnyxImage(imageUrl: string): Promise<Buffer> {
    this.logger.log(`Downloading Telnyx image with authentication: ${imageUrl}`);

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Bearer ${this.telnyxApiKey}`,
      },
      timeout: 30000,
    });

    return Buffer.from(response.data);
  }

  /**
   * Upload an image from a URL to Cloudinary
   */
  async uploadFromUrl(
    imageUrl: string,
    folder: string = 'keepswell',
  ): Promise<{ url: string; thumbnailUrl: string; publicId: string } | null> {
    if (!this.isConfigured) {
      this.logger.warn('Attempted to upload image but Cloudinary is not configured');
      return null;
    }

    try {
      let result: UploadApiResponse;

      // Check if this is a Telnyx URL that requires authentication
      if (this.isTelnyxUrl(imageUrl)) {
        this.logger.log(`Detected Telnyx media URL, downloading with auth...`);

        // Download the image with Telnyx credentials
        const imageBuffer = await this.downloadTelnyxImage(imageUrl);

        // Upload buffer to Cloudinary
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as UploadApiResponse);
            },
          );
          uploadStream.end(imageBuffer);
        });
      } else {
        // Direct URL upload for non-Vonage URLs
        result = await cloudinary.uploader.upload(imageUrl, {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        });
      }

      // Generate thumbnail URL
      const thumbnailUrl = cloudinary.url(result.public_id, {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      });

      this.logger.log(`Image uploaded to Cloudinary: ${result.public_id}`);

      return {
        url: result.secure_url,
        thumbnailUrl,
        publicId: result.public_id,
      };
    } catch (error) {
      this.logger.error(`Failed to upload image to Cloudinary: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  async delete(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted from Cloudinary: ${publicId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete image from Cloudinary: ${error.message}`);
      return false;
    }
  }
}
