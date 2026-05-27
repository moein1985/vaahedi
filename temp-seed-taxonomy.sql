-- Seed: Occupation Categories (Agriculture Stakeholder Platform)
-- Idempotent: ON CONFLICT (code) DO NOTHING
-- Note: columns are camelCase (Prisma default mapping)

INSERT INTO occupation_categories (id, code, "nameFa", "nameEn", "parentId", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'AGRI.FARMER',    'کشاورز / تولیدکننده',    'Farmer / Producer',     NULL, true, 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'AGRI.LIVESTOCK', 'دامدار / پرورش دهنده',   'Livestock Farmer',      NULL, true, 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'AGRI.TRADER',    'بازرگان کشاورزی',        'Agricultural Trader',   NULL, true, 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'AGRI.PROCESSOR', 'فراوری کننده',            'Agri Processor',        NULL, true, 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'AGRI.SERVICE',   'خدمات دهنده کشاورزی',    'Agri Service Provider', NULL, true, 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'AGRI.ORG',       'نهاد و تشکل',             'Organization / Union',  NULL, true, 6, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO occupation_categories (id, code, "nameFa", "nameEn", "parentId", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.nameFa, v.nameEn,
       (SELECT id FROM occupation_categories WHERE code = 'AGRI.FARMER'),
       true, v.sortOrder, NOW(), NOW()
FROM (VALUES
  ('AGRI.FARMER.GRAIN',      'کشاورز غلات (گندم جو ذرت)', 'Grain Farmer',            1),
  ('AGRI.FARMER.FRUIT',      'باغدار (درختی)',              'Fruit Grower',            2),
  ('AGRI.FARMER.VEGETABLE',  'کشاورز سبزیجات و صیفی',      'Vegetable Farmer',        3),
  ('AGRI.FARMER.INDUSTRIAL', 'کشاورز محصولات صنعتی',       'Industrial Crops Farmer', 4),
  ('AGRI.FARMER.GREENHOUSE', 'گلخانه دار',                  'Greenhouse Grower',       5),
  ('AGRI.FARMER.SAFFRON',    'زعفران کار',                  'Saffron Grower',          6)
) AS v(code, "nameFa", "nameEn", "sortOrder")
ON CONFLICT (code) DO NOTHING;

INSERT INTO occupation_categories (id, code, "nameFa", "nameEn", "parentId", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.nameFa, v.nameEn,
       (SELECT id FROM occupation_categories WHERE code = 'AGRI.LIVESTOCK'),
       true, v.sortOrder, NOW(), NOW()
FROM (VALUES
  ('AGRI.LIVESTOCK.CATTLE',  'دامدار (گاو و گوسفند)', 'Cattle Farmer',      1),
  ('AGRI.LIVESTOCK.POULTRY', 'مرغدار',                 'Poultry Farmer',     2),
  ('AGRI.LIVESTOCK.AQUA',    'پرورش دهنده ابزیان',    'Aquaculture Farmer', 3),
  ('AGRI.LIVESTOCK.BEE',     'زنبوردار',               'Beekeeper',          4)
) AS v(code, "nameFa", "nameEn", "sortOrder")
ON CONFLICT (code) DO NOTHING;

INSERT INTO occupation_categories (id, code, "nameFa", "nameEn", "parentId", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.nameFa, v.nameEn,
       (SELECT id FROM occupation_categories WHERE code = 'AGRI.TRADER'),
       true, v.sortOrder, NOW(), NOW()
FROM (VALUES
  ('AGRI.TRADER.EXPORTER', 'صادرکننده محصولات کشاورزی',   'Agri Exporter',   1),
  ('AGRI.TRADER.IMPORTER', 'واردکننده نهاده های کشاورزی', 'Agri Importer',   2),
  ('AGRI.TRADER.DOMESTIC', 'تاجر داخلی / عمده فروش',      'Domestic Trader', 3)
) AS v(code, "nameFa", "nameEn", "sortOrder")
ON CONFLICT (code) DO NOTHING;

INSERT INTO occupation_categories (id, code, "nameFa", "nameEn", "parentId", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.nameFa, v.nameEn,
       (SELECT id FROM occupation_categories WHERE code = 'AGRI.PROCESSOR'),
       true, v.sortOrder, NOW(), NOW()
FROM (VALUES
  ('AGRI.PROCESSOR.FOOD',    'صنایع غذایی',             'Food Industry',  1),
  ('AGRI.PROCESSOR.PACKING', 'بسته بندی کشاورزی',       'Agri Packaging', 2),
  ('AGRI.PROCESSOR.COLD',    'سردخانه / انبار کشاورزی', 'Cold Storage',   3)
) AS v(code, "nameFa", "nameEn", "sortOrder")
ON CONFLICT (code) DO NOTHING;

INSERT INTO occupation_categories (id, code, "nameFa", "nameEn", "parentId", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.nameFa, v.nameEn,
       (SELECT id FROM occupation_categories WHERE code = 'AGRI.SERVICE'),
       true, v.sortOrder, NOW(), NOW()
FROM (VALUES
  ('AGRI.SERVICE.MACHINERY',  'تامین ماشین الات کشاورزی',  'Machinery Supplier', 1),
  ('AGRI.SERVICE.INPUT',      'تامین نهاده (بذر کود سم)',   'Input Supplier',     2),
  ('AGRI.SERVICE.CONSULTING', 'مشاور کشاورزی',               'Agri Consultant',    3),
  ('AGRI.SERVICE.LOGISTICS',  'حمل و نقل و لجستیک',          'Agri Logistics',     4)
) AS v(code, "nameFa", "nameEn", "sortOrder")
ON CONFLICT (code) DO NOTHING;

INSERT INTO occupation_categories (id, code, "nameFa", "nameEn", "parentId", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.nameFa, v.nameEn,
       (SELECT id FROM occupation_categories WHERE code = 'AGRI.ORG'),
       true, v.sortOrder, NOW(), NOW()
FROM (VALUES
  ('AGRI.ORG.COOPERATIVE', 'تعاونی کشاورزی',        'Agri Cooperative',  1),
  ('AGRI.ORG.GUILD',       'اتحادیه صنفی کشاورزی',  'Agri Guild Union',  2),
  ('AGRI.ORG.RESEARCH',    'مرکز تحقیقات کشاورزی',  'Research Institute',3)
) AS v(code, "nameFa", "nameEn", "sortOrder")
ON CONFLICT (code) DO NOTHING;

SELECT count(*) AS total_categories FROM occupation_categories;
