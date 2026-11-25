import { prisma } from '../../lib/prisma';

export class SettingsService {
  async getPublicSettings() {
    const setting = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    return {
      whatsappNumber: setting?.whatsappNumber || '+94770871018',
      defaultLowStockAlert: setting?.defaultLowStockAlert ?? 5,
      bankName: setting?.bankName || 'BOC (Bank of Ceylon)',
      bankAccountName: setting?.bankAccountName || 'K P T Premawansha',
      bankAccountNumber: setting?.bankAccountNumber || '89771480',
      bankBranch: setting?.bankBranch || 'Kesbawa',
    };
  }

  async getSettings() {
    let setting = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: {
          id: 'default',
          defaultLowStockAlert: 5,
          whatsappNumber: '+94771234567',
          hideProfitFromStaff: false,
        },
      });
    }

    const deliveryZones = await prisma.deliveryZone.findMany({
      orderBy: { district: 'asc' },
    });

    return {
      settings: setting,
      deliveryZones: deliveryZones.map((z) => ({
        ...z,
        baseFee: Number(z.baseFee),
        extraPerKg: Number(z.extraPerKg),
      })),
    };
  }

  async updateSystemSettings(data: {
    defaultLowStockAlert?: number;
    whatsappNumber?: string;
    hideProfitFromStaff?: boolean;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankBranch?: string;
  }) {
    return prisma.systemSetting.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        defaultLowStockAlert: data.defaultLowStockAlert ?? 5,
        whatsappNumber: data.whatsappNumber ?? '+94771234567',
        hideProfitFromStaff: data.hideProfitFromStaff ?? false,
        bankName: data.bankName ?? 'BOC (Bank of Ceylon)',
        bankAccountName: data.bankAccountName ?? 'K P T Premawansha',
        bankAccountNumber: data.bankAccountNumber ?? '89771480',
        bankBranch: data.bankBranch ?? 'Kesbawa',
      },
      update: {
        ...(data.defaultLowStockAlert !== undefined && { defaultLowStockAlert: data.defaultLowStockAlert }),
        ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
        ...(data.hideProfitFromStaff !== undefined && { hideProfitFromStaff: data.hideProfitFromStaff }),
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.bankAccountName !== undefined && { bankAccountName: data.bankAccountName }),
        ...(data.bankAccountNumber !== undefined && { bankAccountNumber: data.bankAccountNumber }),
        ...(data.bankBranch !== undefined && { bankBranch: data.bankBranch }),
      },
    });
  }

  async updateDeliveryZone(id: string, data: {
    baseFee?: number;
    extraPerKg?: number;
    estimatedDays?: string;
    isActive?: boolean;
  }) {
    return prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(data.baseFee !== undefined && { baseFee: data.baseFee }),
        ...(data.extraPerKg !== undefined && { extraPerKg: data.extraPerKg }),
        ...(data.estimatedDays !== undefined && { estimatedDays: data.estimatedDays }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }
}

export const settingsService = new SettingsService();
