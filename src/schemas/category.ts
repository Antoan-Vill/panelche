import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    name: z.string(),
    description: z.string().optional(),
    url_handle: z.string().optional(),
    image_url: z.string().optional(),
    order: z.number().optional(),
    parent_id: z.number().nullable().optional(),
  }),
});

export type Category = z.infer<typeof CategorySchema>;


