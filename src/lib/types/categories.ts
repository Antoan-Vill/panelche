export interface Category {
  id: string;
  type: string;
  attributes: {
    name: string;
    description?: string;
    url_handle?: string;
    image_url?: string;
    order?: number;
    parent_id?: number | null;
  };
}


