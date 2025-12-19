import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 定义数据结构接口
interface BarangayData {
  name: string;
}

interface CityData {
  name: string;
  code: string;
  zip: string;
  barangays: string[];
}

interface ProvinceData {
  name: string;
  code: string;
  cities: CityData[];
}

async function main() {
  console.log('🌱 Starting address seeding...');

  // 1. 读取 JSON 文件
  const filePath = path.join(__dirname, 'data/ph_locations.json');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Data file not found at: ${filePath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const provinces: ProvinceData[] = JSON.parse(rawData);

  console.log(`📦 Found ${provinces.length} provinces.`);

  // 2. 开始入库
  for (const provData of provinces) {
    console.log(`Processing: ${provData.name}...`);

    // A. 插入省份 (Upsert: 有则更新，无则创建)
    const province = await prisma.province.upsert({
      where: { provinceName: provData.name }, // 假设省名唯一，实际项目可用 code
      update: {},
      create: {
        provinceName: provData.name,
        provinceCode: provData.code,
        status: 1,
      },
    });

    // B. 处理该省下的城市
    for (const cityData of provData.cities) {
      // 查找或创建城市
      // 注意：这里用 findFirst + create 的组合，因为 cityCode 在 schema 里是可选的
      let city = await prisma.city.findFirst({
        where: {
          provinceId: province.provinceId,
          cityName: cityData.name,
        },
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            provinceId: province.provinceId,
            cityName: cityData.name,
            cityCode: cityData.code,
            postalCode: cityData.zip,
            status: 1,
          },
        });
      }

      // C. 批量插入 Barangay (性能优化点)
      // 如果该城市下还没有 barangay，则进行插入
      const barangayCount = await prisma.barangay.count({
        where: { cityId: city.cityId },
      });

      if (barangayCount === 0 && cityData.barangays.length > 0) {
        const payload = cityData.barangays.map((bName) => ({
          cityId: city!.cityId,
          barangayName: bName,
          status: 1,
        }));

        await prisma.barangay.createMany({
          data: payload,
          skipDuplicates: true,
        });
        console.log(
          `   └─ Added ${payload.length} barangays to ${city.cityName}`,
        );
      }
    }
  }

  // 3. 同时初始化 KYC 证件类型
  const idTypes = [
    { typeName: 'Philippine National ID', requiresBack: 1 },
    { typeName: 'Driver’s License', requiresBack: 1 },
    { typeName: 'Passport', requiresBack: 0 },
    { typeName: 'SSS Card', requiresBack: 0 },
    { typeName: 'UMID', requiresBack: 1 },
  ];

  for (const type of idTypes) {
    await prisma.kycIdType.upsert({
      where: { typeId: idTypes.indexOf(type) + 1 },
      update: {},
      create: {
        typeName: type.typeName,
        requiresBack: type.requiresBack,
        sortOrder: idTypes.indexOf(type),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
