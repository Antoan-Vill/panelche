import { z } from 'zod';
import { badRequest, notFound, serverError, ok } from '@/lib/http/response';
import { cloudCartImages } from '@/lib/services/cloudcart';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ParamsSchema = z.object({ id: z.string().min(1) });
    const parsedParams = ParamsSchema.safeParse({ id });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }

    const imageData = await cloudCartImages.getById(id);

    if (!imageData) {
      return notFound('Image not found');
    }

    return ok(imageData);
  } catch (error) {
    console.error('Error fetching image:', error);
    return serverError('Internal server error');
  }
}


