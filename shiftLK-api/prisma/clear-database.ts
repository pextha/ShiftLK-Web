import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing operational data from ShiftLK database...');

  await prisma.$transaction(async (tx) => {
    // 1. Delete order items & orders
    const deletedOrderItems = await tx.orderItem.deleteMany({});
    const deletedOrders = await tx.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrderItems.count} order items and ${deletedOrders.count} orders.`);

    // 2. Delete stock movements
    const deletedStockMovements = await tx.stockMovement.deleteMany({});
    console.log(`✅ Deleted ${deletedStockMovements.count} stock movements.`);

    // 3. Delete expenses
    const deletedExpenses = await tx.expense.deleteMany({});
    console.log(`✅ Deleted ${deletedExpenses.count} expenses.`);

    // 4. Delete audit logs
    const deletedAuditLogs = await tx.auditLog.deleteMany({});
    console.log(`✅ Deleted ${deletedAuditLogs.count} audit logs.`);

    // 5. Delete product-related child tables
    const deletedVehicleComp = await tx.vehicleCompatibility.deleteMany({});
    const deletedImages = await tx.productImage.deleteMany({});
    const deletedTranslations = await tx.productTranslation.deleteMany({});
    console.log(`✅ Deleted ${deletedVehicleComp.count} vehicle compatibilities, ${deletedImages.count} images, and ${deletedTranslations.count} translations.`);

    // 6. Delete products
    const deletedProducts = await tx.product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.count} products.`);

    // 7. Reset order counter so new manual orders start cleanly
    await tx.orderCounter.upsert({
      where: { id: 'default' },
      update: { lastNumber: 1000 },
      create: { id: 'default', lastNumber: 1000 },
    });
    console.log(`✅ Order counter reset to 1000 (next order will be SLK-001001).`);
  });

  // Verify remaining foundational data
  const [userCount, brandCount, categoryCount, zoneCount] = await Promise.all([
    prisma.user.count(),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.deliveryZone.count(),
  ]);

  console.log('\n🔒 Foundational configuration preserved:');
  console.log(`- Admin Users: ${userCount} (admin@shiftlk.lk active)`);
  console.log(`- Motorbike Brands: ${brandCount} (ready for product dropdowns)`);
  console.log(`- Categories: ${categoryCount} (ready for product dropdowns)`);
  console.log(`- Delivery Zones: ${zoneCount} (25 Sri Lankan Districts ready)`);

  console.log('\n✨ Database is now completely clean and ready for manual data entry!');
}

clearDatabase()
  .catch((e) => {
    console.error('❌ Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
