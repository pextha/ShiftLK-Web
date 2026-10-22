import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { AppError } from '../../middlewares/errorHandler';

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productsService.getProducts(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { slug } = req.params;
    const locale = (req.query.locale as string) || 'en';

    const product = await productsService.getProductBySlug(slug, locale);

    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', `Product with slug "${slug}" was not found`, 404);
    }

    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}
