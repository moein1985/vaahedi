import sharp from 'sharp';

export async function compressImage(
  buffer: Buffer,
  options: { maxWidth?: number; quality?: number; format?: 'jpeg' | 'webp' } = {}
): Promise<Buffer> {
  const { maxWidth = 1200, quality = 80, format = 'webp' } = options;

  return sharp(buffer)
    .resize(maxWidth, undefined, { withoutEnlargement: true })
    .toFormat(format, { quality })
    .toBuffer();
}

export async function createThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .toFormat('webp', { quality: 70 })
    .toBuffer();
}