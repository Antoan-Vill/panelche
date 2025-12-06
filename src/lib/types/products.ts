export interface Variant {
  id: string;
  type: string;
  attributes: {
    item_id: number;
    v1: string | null;
    v2: string | null;
    v3: string | null;
    v1_id: number | null;
    v2_id: number | null;
    v3_id: number | null;
    quantity: number;
    sku: string;
    barcode: string;
    price: number;
    delivery_price: number | null;
    weight: number | null;
    unit_id: number | null;
    unit_value: number | null;
    unit_text: string | null;
    minimum: number;
    base_unit_value: number;
    base_unit_id: number | null;
    unit_type: string;
    unit_name: string | null;
    unit_short_name: string | null;
    unit_value_formatted: string | null;
  };
}

export interface ImageData {
  id: string;
  type: string;
  attributes: {
    name: string;
    image_id: string;
    parent_id: number;
    sort_order: number;
    last_edited: string;
    date_added: string;
    active: string;
    max_thumb_size: number;
    background: string | null;
    width: number;
    height: number;
    gallery_id: string | null;
    video_url: string | null;
    created_at: string;
    updated_at: string;
    image_processed: number;
    src: string;
    thumbs: {
      "150x150": string;
      "300x300": string;
      "600x600": string;
      "800x800": string;
      "1280x1280": string;
      "1920x1920": string;
      "original": string;
    };
  };
}

export interface ProductRelationships {
  image?: {
    data: {
      type: string;
      id: string;
    };
  };
  category?: {
    data: {
      type: string;
      id: string;
    };
  };
  vendor?: {
    data: {
      type: string;
      id: string;
    };
  };
}

export interface ProductPrice {
  type: string;
  value: number;
}

export interface Product {
  id: string;
  type: string;
  attributes: {
    name: string;
    description?: string;
    price: number;
    price_from?: number;
    price_to?: number;
    prices?: ProductPrice[];
    image_url?: string;
    thumbnail_url?: string;
    url_handle?: string;
    sku?: string;
    stock_quantity?: number;
    is_in_stock?: boolean;
    categories?: Array<{
      id: string;
      name: string;
      url_handle?: string;
    }>;
    tags?: string[];
    color?: string;
    // Base64 image storage (temporary solution)
    image_base64?: string;
    image_base64_updated_at?: string;
  };
  relationships?: ProductRelationships;
  variants?: Variant[];
  image?: ImageData;
}

export interface PaginationMeta {
  page: {
    'current-page': number;
    'per-page': number;
    from: number;
    to: number;
    total: number;
    'last-page': number;
  };
}

export interface ProductsResponse {
  data: Product[];
  meta: PaginationMeta;
}


