import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';

export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await analyticsService.getOverview();
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSalesTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const result = await analyticsService.getSalesTimeline(days);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getTopProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const result = await analyticsService.getTopProducts(limit);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 3;
    const result = await analyticsService.getLowStock(threshold);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { period, startDate, endDate } = req.query;
    const result = await analyticsService.getReports({
      period: period as any,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
