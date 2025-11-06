import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z
    .object({
      name: z.string(),
      description: z.string().nullable().optional(),
      url_handle: z.string().nullable().optional(),
      image_url: z.string().nullable().optional(),
      order: z.number().optional(),
      parent_id: z.number().nullable().optional(),
    })
    .passthrough(),
}).passthrough();

export type Category = z.infer<typeof CategorySchema>;



