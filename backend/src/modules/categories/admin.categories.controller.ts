import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';

export async function getAdminCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await categoriesService.getAdminCategories();
    res.json({
      status: 'success',
      data: categories,
      meta: { total: categories.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCategoryById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const category = await categoriesService.getAdminCategoryById(id);
    res.json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = await categoriesService.createCategory(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const category = await categoriesService.updateCategory(id, req.body);
    res.json({
      status: 'success',
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await categoriesService.deleteCategory(id);
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
