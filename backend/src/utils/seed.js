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
    { name: 'Diabetic Care', slug: 'diabetic-care', icon: '🩸' },
    { name: 'Baby & Mom', slug: 'baby-and-mom', icon: '🍼' },
    { name: 'Personal Care', slug: 'personal-care', icon: '🧴' },
    { name: "Women's Care", slug: 'womens-care', icon: '🌸' },
    { name: 'Health & Devices', slug: 'health-and-devices', icon: '🩺' },
    { name: 'Vitamins & Supplements', slug: 'vitamins-and-supplements', icon: '💊' },
    { name: 'Vital Wellness', slug: 'vital-wellness', icon: '🌿' },
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
    { name: 'Metformin', therapeuticClass: 'Biguanide (Antidiabetic)' },
    { name: 'Gliclazide', therapeuticClass: 'Sulfonylurea (Antidiabetic)' },
    { name: 'Lactic Acid Bacillus', therapeuticClass: 'Probiotic' },
    { name: 'Zinc Sulphate', therapeuticClass: 'Mineral Supplement' },
    { name: 'White Petroleum Jelly', therapeuticClass: 'Emollient / Skin Protectant' },
    { name: 'Povidone Iodine', therapeuticClass: 'Antiseptic' },
    { name: 'Ferrous Fumarate + Folic Acid', therapeuticClass: 'Hematinic' },
    { name: 'Calcium Carbonate + Vitamin D3', therapeuticClass: 'Mineral / Vitamin Supplement' },
    { name: 'Multivitamin & Multimineral', therapeuticClass: 'Vitamin Supplement' },
    { name: 'Ascorbic Acid (Vitamin C)', therapeuticClass: 'Vitamin Supplement' },
    { name: 'Omeprazole', therapeuticClass: 'Proton Pump Inhibitor' },
    { name: 'ORS', therapeuticClass: 'Oral Rehydration Salt' },
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

    // -- Diabetic Care ------------------------------------------------------
    {
      name: 'Comet 500mg Tablet',
      slug: 'comet-500mg-tablet',
      sku: 'SKU-MET500',
      genericName: 'Metformin',
      generic: genericDocs['Metformin']._id,
      category: categoryDocs['diabetic-care']._id,
      dosageForm: 'TABLET',
      strength: '500mg',
      manufacturer: 'Square Pharmaceuticals',
      prescriptionRequired: true,
      description: 'First-line oral antidiabetic that lowers blood glucose by reducing hepatic glucose production and improving insulin sensitivity.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=Metformin+500mg'],
      mrp: 5,
      sellingPrice: 4,
      stockQuantity: 600,
      tags: ['diabetes', 'metformin', 'type 2 diabetes'],
      isBestSeller: true,
    },
    {
      name: 'Diamicron MR 60mg Tablet',
      slug: 'diamicron-mr-60mg-tablet',
      sku: 'SKU-GLIC60',
      genericName: 'Gliclazide',
      generic: genericDocs['Gliclazide']._id,
      category: categoryDocs['diabetic-care']._id,
      dosageForm: 'TABLET',
      strength: '60mg',
      manufacturer: 'Servier Bangladesh',
      prescriptionRequired: true,
      description: 'Modified-release sulfonylurea that stimulates insulin secretion to control blood glucose in type 2 diabetes.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=Gliclazide+60mg'],
      mrp: 9,
      sellingPrice: 8,
      stockQuantity: 350,
      tags: ['diabetes', 'gliclazide'],
    },
    {
      name: 'Digital Blood Glucose Monitor',
      slug: 'digital-blood-glucose-monitor',
      sku: 'SKU-GLUCOMETER',
      category: categoryDocs['diabetic-care']._id,
      dosageForm: 'DEVICE',
      manufacturer: 'OK Biotech',
      prescriptionRequired: false,
      description: 'Compact blood glucose monitoring kit with 25 free test strips and lancets for at-home diabetes tracking.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=Glucometer'],
      mrp: 1800,
      sellingPrice: 1550,
      discountPercent: 14,
      stockQuantity: 60,
      tags: ['diabetes', 'glucometer', 'device'],
      isFeatured: true,
    },

    // -- Baby & Mom -----------------------------------------------------
    {
      name: 'ORSaline-N Sachet',
      slug: 'orsaline-n-sachet',
      sku: 'SKU-ORS-N',
      genericName: 'ORS',
      generic: genericDocs['ORS']._id,
      category: categoryDocs['baby-and-mom']._id,
      dosageForm: 'OTHER',
      strength: '20.5g',
      manufacturer: 'ACME Laboratories',
      prescriptionRequired: false,
      description: 'Oral rehydration salt to quickly replace fluids and electrolytes lost during diarrhea or vomiting in babies and children.',
      images: ['https://placehold.co/600x600/f97316/ffffff?text=ORSaline'],
      mrp: 8,
      sellingPrice: 7,
      stockQuantity: 800,
      tags: ['baby', 'rehydration', 'ors'],
      isBestSeller: true,
    },
    {
      name: 'Baby Diaper Pants (Size M, 44 pcs)',
      slug: 'baby-diaper-pants-medium-44pcs',
      sku: 'SKU-DIAPER-M44',
      category: categoryDocs['baby-and-mom']._id,
      dosageForm: 'OTHER',
      manufacturer: 'Pampers',
      prescriptionRequired: false,
      description: 'Soft, breathable diaper pants for babies 6-11kg with up to 12-hour leak protection.',
      images: ['https://placehold.co/600x600/f97316/ffffff?text=Diaper+Pants'],
      mrp: 950,
      sellingPrice: 850,
      discountPercent: 11,
      stockQuantity: 150,
      tags: ['baby', 'diaper', 'hygiene'],
      isFeatured: true,
    },
    {
      name: 'Baby Gripe Water 100ml',
      slug: 'baby-gripe-water-100ml',
      sku: 'SKU-GRIPEWATER',
      category: categoryDocs['baby-and-mom']._id,
      dosageForm: 'SYRUP',
      strength: '100ml',
      manufacturer: 'Woodward\'s',
      prescriptionRequired: false,
      description: 'Gentle relief from infant colic, hiccups, and wind for newborns and infants.',
      images: ['https://placehold.co/600x600/f97316/ffffff?text=Gripe+Water'],
      mrp: 90,
      sellingPrice: 80,
      stockQuantity: 200,
      tags: ['baby', 'colic', 'infant care'],
    },

    // -- Personal Care --------------------------------------------------
    {
      name: 'Povisep Antiseptic Solution 100ml',
      slug: 'povisep-antiseptic-solution-100ml',
      sku: 'SKU-POVI100',
      genericName: 'Povidone Iodine',
      generic: genericDocs['Povidone Iodine']._id,
      category: categoryDocs['personal-care']._id,
      dosageForm: 'OTHER',
      strength: '10% w/v, 100ml',
      manufacturer: 'Square Pharmaceuticals',
      prescriptionRequired: false,
      description: 'Broad-spectrum antiseptic solution for cleaning wounds, cuts, and minor skin infections.',
      images: ['https://placehold.co/600x600/6366f1/ffffff?text=Antiseptic'],
      mrp: 65,
      sellingPrice: 58,
      stockQuantity: 300,
      tags: ['antiseptic', 'wound care', 'first aid'],
    },
    {
      name: 'Vaseline Petroleum Jelly 100ml',
      slug: 'vaseline-petroleum-jelly-100ml',
      sku: 'SKU-VASELINE100',
      genericName: 'White Petroleum Jelly',
      generic: genericDocs['White Petroleum Jelly']._id,
      category: categoryDocs['personal-care']._id,
      dosageForm: 'OTHER',
      strength: '100ml',
      manufacturer: 'Unilever',
      prescriptionRequired: false,
      description: 'Pure skin protectant jelly that moisturizes and helps heal dry, cracked skin.',
      images: ['https://placehold.co/600x600/6366f1/ffffff?text=Petroleum+Jelly'],
      mrp: 220,
      sellingPrice: 195,
      discountPercent: 11,
      stockQuantity: 250,
      tags: ['skin care', 'moisturizer'],
      isBestSeller: true,
    },
    {
      name: 'Hand Sanitizer 200ml',
      slug: 'hand-sanitizer-200ml',
      sku: 'SKU-SANITIZER200',
      category: categoryDocs['personal-care']._id,
      dosageForm: 'OTHER',
      strength: '70% Alcohol, 200ml',
      manufacturer: 'ACI Limited',
      prescriptionRequired: false,
      description: 'Alcohol-based hand sanitizer that kills 99.9% of germs without water.',
      images: ['https://placehold.co/600x600/6366f1/ffffff?text=Hand+Sanitizer'],
      mrp: 150,
      sellingPrice: 130,
      stockQuantity: 400,
      tags: ['hygiene', 'sanitizer'],
    },

    // -- Women's Care -----------------------------------------------------
    {
      name: 'Sanitary Napkins Ultra Thin (10 pcs)',
      slug: 'sanitary-napkins-ultra-thin-10pcs',
      sku: 'SKU-NAPKIN10',
      category: categoryDocs['womens-care']._id,
      dosageForm: 'OTHER',
      manufacturer: 'Whisper',
      prescriptionRequired: false,
      description: 'Ultra-thin sanitary napkins with rapid-absorb technology for all-day comfort and protection.',
      images: ['https://placehold.co/600x600/ec4899/ffffff?text=Sanitary+Napkins'],
      mrp: 130,
      sellingPrice: 115,
      discountPercent: 11,
      stockQuantity: 300,
      tags: ['women', 'sanitary', 'hygiene'],
      isFeatured: true,
    },
    {
      name: 'Ferrotron Tablet (Ferrous Fumarate + Folic Acid)',
      slug: 'ferrotron-tablet',
      sku: 'SKU-FERROFOL',
      genericName: 'Ferrous Fumarate + Folic Acid',
      generic: genericDocs['Ferrous Fumarate + Folic Acid']._id,
      category: categoryDocs['womens-care']._id,
      dosageForm: 'TABLET',
      manufacturer: 'Beximco Pharmaceuticals',
      prescriptionRequired: false,
      description: 'Iron and folic acid supplement commonly recommended during pregnancy and for iron-deficiency anemia.',
      images: ['https://placehold.co/600x600/ec4899/ffffff?text=Iron+%2B+Folic+Acid'],
      mrp: 45,
      sellingPrice: 40,
      stockQuantity: 350,
      tags: ['women', 'pregnancy', 'iron supplement'],
    },
    {
      name: 'Caldimax-D Tablet (Calcium + Vitamin D3)',
      slug: 'caldimax-d-tablet',
      sku: 'SKU-CALD3',
      genericName: 'Calcium Carbonate + Vitamin D3',
      generic: genericDocs['Calcium Carbonate + Vitamin D3']._id,
      category: categoryDocs['womens-care']._id,
      dosageForm: 'TABLET',
      manufacturer: 'Renata Limited',
      prescriptionRequired: false,
      description: 'Calcium and Vitamin D3 supplement supporting bone health, especially for women during and after pregnancy.',
      images: ['https://placehold.co/600x600/ec4899/ffffff?text=Calcium+%2B+D3'],
      mrp: 90,
      sellingPrice: 80,
      stockQuantity: 300,
      tags: ['women', 'bone health', 'calcium'],
    },

    // -- Health & Devices (additional devices) ---------------------------
    {
      name: 'Digital Infrared Thermometer',
      slug: 'digital-infrared-thermometer',
      sku: 'SKU-THERMO-IR',
      category: categoryDocs['health-and-devices']._id,
      dosageForm: 'DEVICE',
      manufacturer: 'Beurer',
      prescriptionRequired: false,
      description: 'Non-contact infrared thermometer for fast, accurate body temperature readings.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=Thermometer'],
      mrp: 2200,
      sellingPrice: 1899,
      discountPercent: 14,
      stockQuantity: 80,
      tags: ['device', 'thermometer', 'fever'],
      isFeatured: true,
    },
    {
      name: 'Digital Blood Pressure Monitor',
      slug: 'digital-blood-pressure-monitor',
      sku: 'SKU-BPMONITOR',
      category: categoryDocs['health-and-devices']._id,
      dosageForm: 'DEVICE',
      manufacturer: 'Omron',
      prescriptionRequired: false,
      description: 'Automatic upper-arm blood pressure monitor with large display and irregular heartbeat detection.',
      images: ['https://placehold.co/600x600/0d9488/ffffff?text=BP+Monitor'],
      mrp: 3200,
      sellingPrice: 2850,
      discountPercent: 11,
      stockQuantity: 45,
      tags: ['device', 'blood pressure', 'hypertension'],
      isBestSeller: true,
    },

    // -- Vitamins & Supplements -------------------------------------------
    {
      name: 'Centrum Adult Multivitamin (30 tabs)',
      slug: 'centrum-adult-multivitamin-30tabs',
      sku: 'SKU-CENTRUM30',
      genericName: 'Multivitamin & Multimineral',
      generic: genericDocs['Multivitamin & Multimineral']._id,
      category: categoryDocs['vitamins-and-supplements']._id,
      dosageForm: 'TABLET',
      manufacturer: 'Pfizer',
      prescriptionRequired: false,
      description: 'Complete daily multivitamin and multimineral formula to support overall health and energy.',
      images: ['https://placehold.co/600x600/22c55e/ffffff?text=Multivitamin'],
      mrp: 850,
      sellingPrice: 750,
      discountPercent: 12,
      stockQuantity: 120,
      tags: ['vitamins', 'multivitamin', 'supplement'],
      isFeatured: true,
      isBestSeller: true,
    },
    {
      name: 'Vitamin C 500mg Tablet (30 tabs)',
      slug: 'vitamin-c-500mg-tablet-30tabs',
      sku: 'SKU-VITC500',
      genericName: 'Ascorbic Acid (Vitamin C)',
      generic: genericDocs['Ascorbic Acid (Vitamin C)']._id,
      category: categoryDocs['vitamins-and-supplements']._id,
      dosageForm: 'TABLET',
      strength: '500mg',
      manufacturer: 'Square Pharmaceuticals',
      prescriptionRequired: false,
      description: 'Vitamin C supplement that supports immune function and antioxidant protection.',
      images: ['https://placehold.co/600x600/22c55e/ffffff?text=Vitamin+C'],
      mrp: 120,
      sellingPrice: 105,
      stockQuantity: 260,
      tags: ['vitamins', 'immunity', 'vitamin c'],
    },
    {
      name: 'Zinc-C Tablet (20mg)',
      slug: 'zinc-c-tablet-20mg',
      sku: 'SKU-ZINCC20',
      genericName: 'Zinc Sulphate',
      generic: genericDocs['Zinc Sulphate']._id,
      category: categoryDocs['vitamins-and-supplements']._id,
      dosageForm: 'TABLET',
      strength: '20mg',
      manufacturer: 'Beacon Pharmaceuticals',
      prescriptionRequired: false,
      description: 'Zinc supplement that supports immune health and wound healing.',
      images: ['https://placehold.co/600x600/22c55e/ffffff?text=Zinc'],
      mrp: 70,
      sellingPrice: 60,
      stockQuantity: 220,
      tags: ['vitamins', 'zinc', 'immunity'],
    },

    // -- Vital Wellness -----------------------------------------------------
    {
      name: 'Seclo 20mg Capsule',
      slug: 'seclo-20mg-capsule',
      sku: 'SKU-OMEP20',
      genericName: 'Omeprazole',
      generic: genericDocs['Omeprazole']._id,
      category: categoryDocs['vital-wellness']._id,
      dosageForm: 'CAPSULE',
      strength: '20mg',
      manufacturer: 'Square Pharmaceuticals',
      prescriptionRequired: false,
      description: 'Proton pump inhibitor that reduces stomach acid, used for heartburn, acidity, and peptic ulcers.',
      images: ['https://placehold.co/600x600/8b5cf6/ffffff?text=Omeprazole+20mg'],
      mrp: 6,
      sellingPrice: 5,
      stockQuantity: 500,
      tags: ['acidity', 'gastric', 'omeprazole'],
      isBestSeller: true,
    },
    {
      name: 'Biolac Capsule (Probiotic)',
      slug: 'biolac-capsule',
      sku: 'SKU-PROBIOTIC',
      genericName: 'Lactic Acid Bacillus',
      generic: genericDocs['Lactic Acid Bacillus']._id,
      category: categoryDocs['vital-wellness']._id,
      dosageForm: 'CAPSULE',
      manufacturer: 'ACI Limited',
      prescriptionRequired: false,
      description: 'Probiotic supplement that restores healthy gut flora, often taken alongside antibiotics.',
      images: ['https://placehold.co/600x600/8b5cf6/ffffff?text=Probiotic'],
      mrp: 55,
      sellingPrice: 48,
      stockQuantity: 280,
      tags: ['gut health', 'probiotic', 'digestion'],
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
