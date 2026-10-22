import { Prisma } from '@prisma/client';

export async function generateNextOrderCode(tx: Prisma.TransactionClient): Promise<string> {
  // Concurrency-safe counter update with row lock
  await tx.$executeRaw`UPDATE order_counters SET last_number = last_number + 1 WHERE id = 'default'`;

  const counter = await tx.orderCounter.findUnique({
    where: { id: 'default' },
  });

  const nextNumber = counter ? counter.lastNumber : 124;
  return `SLK-${String(nextNumber).padStart(6, '0')}`;
}
