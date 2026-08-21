'use strict';

/**
 * Seeds a minimal but functional dataset: a super admin account, a couple
 * of catalog categories/products, and a default delivery zone. Run with
 * `npm run seed` after MongoDB is up. Safe to re-run (idempotent upserts).
 */

const { connectDB, disconnectDB } = require('../config/database');
const logger = require('./logger');
const { hashPassword } = require('./crypto');
const { ROLES } = require('../constants/roles');

async function seed() {
  await connectDB();

  const User = require('../modules/users/user.model');
  const Category = require('../modules/categories/category.model');
  const Product = require('../modules/products/product.model');
  const Generic = require('../modules/generics/generic.model');
  const Warehouse = require('../modules/warehouses/warehouse.model');
  const InventoryBatch = require('../modules/inventory/inventoryBatch.model');
  const DeliveryZone = require('../modules/delivery/deliveryZone.model');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@epharmacy.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    });
    logger.info(`Created super admin: ${adminEmail} / ${adminPassword} (change this password immediately)`);
  } else {
    logger.info(`Super admin already exists: ${adminEmail}`);
  }

  const categoriesSeed = [
    { name: 'Diabetic Care', slug: 'diabetic-care' },
    { name: 'Baby & Mom', slug: 'baby-and-mom' },
    { name: 'Personal Care', slug: 'personal-care' },
    { name: "Women's Care", slug: 'womens-care' },
    { name: 'Health & Devices', slug: 'health-and-devices' },
    { name: 'Vitamins & Supplements', slug: 'vitamins-and-supplements' },
    { name: 'Vital Wellness', slug: 'vital-wellness' },
  ];

  const categoryDocs = {};
  for (const cat of categoriesSeed) {
    const doc = await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
    categoryDocs[cat.slug] = doc;
  }
  logger.info(`Seeded ${categoriesSeed.length} categories`);

  const genericsSeed = [
    { name: 'Paracetamol', therapeuticClass: 'Analgesic / Antipyretic' },
    { name: 'Insulin Glargine', therapeuticClass: 'Long-acting Insulin' },
    { name: 'Amoxicillin', therapeuticClass: 'Antibiotic (Penicillin)' },
    { name: 'Cetirizine', therapeuticClass: 'Antihistamine' },
  ];
  const genericDocs = {};
  for (const generic of genericsSeed) {
    const doc = await Generic.findOneAndUpdate({ name: generic.name }, generic, { upsert: true, new: true });
    genericDocs[generic.name] = doc;
  }
  logger.info(`Seeded ${genericsSeed.length} generics`);

  const sampleProducts = [
    {
      name: 'Napa 500mg Tablet',
      slug: 'napa-500mg-tablet',
      sku: 'SKU-NAPA500',
      genericName: 'Paracetamol',
      generic: genericDocs['Paracetamol']._id,
      category: categoryDocs['health-and-devices']._id,
      dosageForm: 'TABLET',
      strength: '500mg',
      manufacturer: 'Beximco Pharmaceuticals',
      prescriptionRequired: false,
      description: 'Fast-acting analgesic and antipyretic used for fever, headache, and mild to moderate pain relief.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=Napa+500mg'],
      mrp: 12,
      sellingPrice: 10,
      stockQuantity: 500,
      tags: ['fever', 'pain relief', 'paracetamol'],
      isFeatured: true,
      isBestSeller: true,
    },
    {
      name: 'Insulin Glargine Injection',
      slug: 'insulin-glargine-injection',
      sku: 'SKU-INSGLA100',
      genericName: 'Insulin Glargine',
      generic: genericDocs['Insulin Glargine']._id,
      category: categoryDocs['diabetic-care']._id,
      dosageForm: 'INJECTION',
      strength: '100IU/ml',
      manufacturer: 'Novo Nordisk',
      prescriptionRequired: true,
      description: 'Long-acting basal insulin analogue used once daily to manage blood glucose in diabetes.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=Insulin+Glargine'],
      mrp: 1200,
      sellingPrice: 1100,
      stockQuantity: 50,
      tags: ['diabetes', 'insulin'],
    },
    {
      // Common line-item on real prescriptions; added so the OCR matcher has
      // something to resolve it against (see prescription.service.js).
      name: 'Amoxicillin 250mg Capsule',
      slug: 'amoxicillin-250mg-capsule',
      sku: 'SKU-AMOX250',
      genericName: 'Amoxicillin',
      generic: genericDocs['Amoxicillin']._id,
      category: categoryDocs['health-and-devices']._id,
      dosageForm: 'CAPSULE',
      strength: '250mg',
      manufacturer: 'Square Pharmaceuticals',
      prescriptionRequired: true,
      description: 'Broad-spectrum penicillin antibiotic used to treat bacterial infections of the respiratory tract, ear, throat, and urinary tract.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=Amoxicillin+250mg'],
      mrp: 8,
      sellingPrice: 7,
      stockQuantity: 300,
      tags: ['antibiotic', 'amoxicillin', 'infection'],
    },
    {
      // Mock/demo medicine: fully populated so it can be used end-to-end to
      // exercise search, product detail, cart/checkout, and prescription
      // OCR matching (see the test prescription fixture used to validate
      // the matcher against this exact product).
      name: 'Cetirizine 10mg Tablet',
      slug: 'cetirizine-10mg-tablet',
      sku: 'SKU-CETI10',
      genericName: 'Cetirizine',
      generic: genericDocs['Cetirizine']._id,
      category: categoryDocs['health-and-devices']._id,
      dosageForm: 'TABLET',
      strength: '10mg',
      manufacturer: 'ACI Limited',
      prescriptionRequired: false,
      description: 'Second-generation antihistamine that relieves allergy symptoms such as sneezing, runny nose, watery eyes, and itching, with once-daily non-drowsy dosing.',
      images: ['https://placehold.co/600x600/14b8a6/ffffff?text=Cetirizine+10mg'],
      mrp: 6,
      sellingPrice: 5,
      discountPercent: 10,
      stockQuantity: 400,
      tags: ['antihistamine', 'allergy', 'cetirizine'],
      isFeatured: true,
    },
  ];

  const productDocs = {};
  for (const product of sampleProducts) {
    productDocs[product.slug] = await Product.findOneAndUpdate({ slug: product.slug }, product, { upsert: true, new: true });
  }
  logger.info(`Seeded ${sampleProducts.length} sample products`);

  // Product.stockQuantity above is display-only - checkout actually reserves
  // stock from InventoryBatch documents (FEFO, see inventory.service.js
  // reserveStock()), so without at least one active batch per product, every
  // order for these products fails at checkout with "Insufficient stock
  // available" no matter what stockQuantity says.
  const warehouse = await Warehouse.findOneAndUpdate(
    { code: 'WH-DHK-01' },
    { name: 'Dhaka Central Warehouse', code: 'WH-DHK-01', district: 'Dhaka', isActive: true },
    { upsert: true, new: true }
  );

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  for (const product of sampleProducts) {
    const doc = productDocs[product.slug];
    await InventoryBatch.findOneAndUpdate(
      { product: doc._id, warehouse: warehouse._id, batchNumber: 'SEED-BATCH-01' },
      {
        product: doc._id,
        warehouse: warehouse._id,
        batchNumber: 'SEED-BATCH-01',
        purchasePrice: Math.round(product.sellingPrice * 0.7),
        sellingPrice: product.sellingPrice,
        quantity: product.stockQuantity,
        expiryDate: oneYearFromNow,
        status: 'ACTIVE',
      },
      { upsert: true }
    );
  }
  logger.info(`Seeded ${sampleProducts.length} inventory batches at ${warehouse.name}`);

  await DeliveryZone.findOneAndUpdate(
    { district: 'Dhaka', area: '' },
    { district: 'Dhaka', area: '', charge: 60, expressCharge: 120, estimatedDays: 1, isActive: true },
    { upsert: true }
  );
  logger.info('Seeded default delivery zone for Dhaka');

  logger.info('Seeding complete.');
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seeding failed: ${err.stack || err.message}`);
  process.exit(1);
});
