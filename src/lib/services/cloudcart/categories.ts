import { getCloudCartClient } from './client';
import { CategorySchema } from '@/schemas/category';
import type { Category } from '@/lib/types/categories';
import { cloudCartImages } from './images';

export interface GetCategoriesOptions {
  limit?: number;
  offset?: number;
  include?: string;
}

export interface GetCategoriesResponse {
  data: RawCategory[];
}

/**
 * Raw category data from CloudCart API (may include passthrough fields)
 */
interface RawCategoryAttributes {
  image_id?: string;
  [key: string]: unknown;
}

interface RawCategory {
  attributes?: RawCategoryAttributes;
  [key: string]: unknown;
}

/**
 * Category with temporary image ID property
 */
interface CategoryWithImageId extends Category {
  _imageId?: string;
}

/**
 * CloudCart Categories API
 */
export class CloudCartCategoriesService {
  constructor(private client = getCloudCartClient()) {}

  /**
   * Get all categories
   */
  async getAll(options: GetCategoriesOptions = {}): Promise<Category[]> {
    const { limit = 50, offset = 0, include } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    // if (include) {
    //   params.append('include', include);
    // }

    const response = await this.client.get<GetCategoriesResponse>(
      `/api/v2/categories?${params.toString()}`,
      this.client.categoriesRevalidate
    );

    const categories = response.data || [];
    
    // Validate and transform categories, preserving image_id for image fetching
    const validatedCategoriesWithImageIds = categories
      .map((cat: RawCategory) => {
        const parsed = CategorySchema.safeParse(cat);
        if (!parsed.success) {
          console.warn('Invalid category data:', parsed.error);
          return null;
        }
        // Transform schema Category to lib Category (convert null to undefined)
        const schemaCategory = parsed.data;
        // Extract image_id from raw attributes (may exist due to passthrough)
        const imageId = cat?.attributes?.image_id as string | undefined;
        const transformedCategory: CategoryWithImageId = {
          ...schemaCategory,
          attributes: {
            ...schemaCategory.attributes,
            description: schemaCategory.attributes.description === null 
              ? undefined 
              : schemaCategory.attributes.description,
            url_handle: schemaCategory.attributes.url_handle === null 
              ? undefined 
              : schemaCategory.attributes.url_handle,
            image_url: schemaCategory.attributes.image_url === null 
              ? undefined 
              : schemaCategory.attributes.image_url,
          },
        };
        if (imageId) {
          transformedCategory._imageId = imageId;
        }
        return transformedCategory;
      })
      .filter((cat): cat is CategoryWithImageId => cat !== null);

    // If images are requested, fetch them
    if (include?.includes('images')) {
      return Promise.all(
        validatedCategoriesWithImageIds.map(async (category) => {
          const imageId = category._imageId;
          if (imageId) {
            const imageData = await cloudCartImages.getById(imageId);
            if (imageData) {
              category.attributes.image_url = cloudCartImages.getImageUrl(imageData) || undefined;
            }
          }
          // Remove the temporary _imageId property
          const { _imageId, ...cleanCategory } = category;
          return cleanCategory;
        })
      );
    }

    // Remove temporary _imageId property if not fetching images
    const validatedCategories = validatedCategoriesWithImageIds.map((cat) => {
      const { _imageId, ...cleanCategory } = cat;
      return cleanCategory;
    });

    return validatedCategories;
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug: string): Promise<Category | null> {
    // Fetch with images included to get image_id
    const allCategories = await this.getAll({ include: 'images' });
    const category = allCategories.find(
      (cat) => cat.attributes.url_handle === slug
    );

    return category || null;
  }
}

let categoriesInstance: CloudCartCategoriesService | null = null;

function getCloudCartCategoriesInstance(): CloudCartCategoriesService {
  if (typeof window !== 'undefined') {
    throw new Error('CloudCartCategoriesService can only be used on the server');
  }
  if (!categoriesInstance) {
    categoriesInstance = new CloudCartCategoriesService();
  }
  return categoriesInstance;
}

// Lazy singleton - only created when accessed
export const cloudCartCategories = new Proxy({} as CloudCartCategoriesService, {
  get(_target, prop) {
    const instance = getCloudCartCategoriesInstance();
    const value = instance[prop as keyof CloudCartCategoriesService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

