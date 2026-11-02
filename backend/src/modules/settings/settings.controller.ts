import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { auditService } from '../audit/audit.service';

export async function getPublicSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await settingsService.getPublicSettings();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await settingsService.getSettings();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await settingsService.updateSystemSettings(req.body);

    await auditService.log({
      userId: req.user?.id,
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'SystemSetting',
      entityId: 'default',
      newValues: req.body,
      ipAddress: req.ip,
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await settingsService.updateDeliveryZone(id, req.body);

    await auditService.log({
      userId: req.user?.id,
      action: 'DELIVERY_ZONE_UPDATED',
      entityType: 'DeliveryZone',
      entityId: id,
      newValues: req.body,
      ipAddress: req.ip,
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
