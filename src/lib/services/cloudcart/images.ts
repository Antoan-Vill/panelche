import { getCloudCartClient } from './client';
import type { ImageData } from '@/lib/types/products';
import { ImageDataSchema } from '@/schemas/product';

/**
 * Raw CloudCart API response for images
 */
interface CloudCartImageResponse {
  data: unknown;
  [key: string]: unknown;
}

/**
 * CloudCart Images API
 */
export class CloudCartImagesService {
  constructor(private client = getCloudCartClient()) {}

  /**
   * Get image details by ID
   */
  async getById(imageId: string): Promise<ImageData | null> {
    try {
      const response = await this.client.get<CloudCartImageResponse>(
        `/api/v2/images/${imageId}`,
        this.client.productsRevalidate
      );

      const parsed = ImageDataSchema.safeParse(response.data);
      if (!parsed.success) {
        console.warn(`Invalid image data received for image ${imageId}:`, parsed.error);
        return null;
      }

      // Transform schema ImageData to lib ImageData (convert undefined to null for background)
      const schemaImageData = parsed.data;
      return {
        ...schemaImageData,
        attributes: {
          ...schemaImageData.attributes,
          background: schemaImageData.attributes.background ?? null,
          video_url: schemaImageData.attributes.video_url ?? null,
          gallery_id: schemaImageData.attributes.gallery_id ?? null,
        },
      } as ImageData;
    } catch (error) {
      console.warn(`Failed to fetch image ${imageId}:`, error);
      return null;
    }
  }

  /**
   * Get image URL from image data
   */
  getImageUrl(imageData: ImageData | null | undefined): string | null {
    if (!imageData) return null;
    return imageData.attributes.thumbs?.original || imageData.attributes.src || null;
  }
}

let imagesInstance: CloudCartImagesService | null = null;

function getCloudCartImagesInstance(): CloudCartImagesService {
  if (typeof window !== 'undefined') {
    throw new Error('CloudCartImagesService can only be used on the server');
  }
  if (!imagesInstance) {
    imagesInstance = new CloudCartImagesService();
  }
  return imagesInstance;
}

// Lazy singleton - only created when accessed
export const cloudCartImages = new Proxy({} as CloudCartImagesService, {
  get(_target, prop) {
    const instance = getCloudCartImagesInstance();
    const value = instance[prop as keyof CloudCartImagesService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

