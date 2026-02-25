import { Client as MinioClient } from 'minio';
import type { IStorageService, UploadResult } from '../../application/ports/index.js';

export class MinioStorageService implements IStorageService {
  private client: MinioClient;
  private defaultBucket: string;

  constructor(config: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
  }) {
    this.client = new MinioClient({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.defaultBucket = config.bucket;
  }

  async ensureBucketExists(bucket: string = this.defaultBucket): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
      console.log(`[MinIO] Created bucket: ${bucket}`);
    }
  }

  async uploadFile(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
    bucket?: string;
  }): Promise<UploadResult> {
    const bucket = params.bucket ?? this.defaultBucket;
    await this.ensureBucketExists(bucket);

    await this.client.putObject(bucket, params.key, params.buffer, params.size, {
      'Content-Type': params.mimeType,
    });

    const url = await this.getPresignedUrl(params.key);

    return {
      key: params.key,
      url,
      bucket,
      size: params.size,
    };
  }

  async getPresignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.defaultBucket, key, expirySeconds);
  }

  async getPresignedUploadUrl(key: string, _mimeType: string, expirySeconds = 600): Promise<string> {
    return this.client.presignedPutObject(this.defaultBucket, key, expirySeconds);
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.removeObject(this.defaultBucket, key);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.defaultBucket, key);
      return true;
    } catch {
      return false;
    }
  }
}
