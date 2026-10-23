import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { entityType, entityId, action, userId, page, limit } = req.query;
    const result = await auditService.getLogs({
      entityType: entityType as string,
      entityId: entityId as string,
      action: action as string,
      userId: userId as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
