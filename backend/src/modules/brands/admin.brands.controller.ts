import { Request, Response, NextFunction } from 'express';
import { brandsService } from './brands.service';

export async function getAdminBrands(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const brands = await brandsService.getAdminBrands();
    res.json({
      status: 'success',
      data: brands,
      meta: { total: brands.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminBrandById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const brand = await brandsService.getAdminBrandById(id);
    res.json({
      status: 'success',
      data: brand,
    });
  } catch (error) {
    next(error);
  }
}

export async function createBrand(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const brand = await brandsService.createBrand(req.body, userId, req.ip);
    res.status(201).json({
      status: 'success',
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBrand(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const brand = await brandsService.updateBrand(id, req.body, userId, req.ip);
    res.json({
      status: 'success',
      message: 'Brand updated successfully',
      data: brand,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBrand(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const result = await brandsService.deleteBrand(id, userId, req.ip);
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

