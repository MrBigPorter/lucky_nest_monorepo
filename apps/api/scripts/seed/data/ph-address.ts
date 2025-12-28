// prisma/data/ph-address.ts

export const phAddressData = [
  {
    province: 'Metro Manila', // 虽然行政上是 Region，但在地址库常作为 Province 处理
    code: 'NCR',
    cities: [
      {
        name: 'Makati City',
        code: '137602',
        postalCode: '1200',
        barangays: [
          'Bel-Air',
          'Poblacion',
          'San Lorenzo',
          'Urdaneta',
          'San Antonio',
          'Pio del Pilar',
        ],
      },
      {
        name: 'Taguig City',
        code: '137607',
        postalCode: '1630',
        barangays: [
          'Fort Bonifacio',
          'Pinagsama',
          'Western Bicutan',
          'Upper Bicutan',
          'Ususan',
        ],
      },
      {
        name: 'Pasay City',
        code: '137605',
        postalCode: '1300',
        barangays: ['Barangay 76', 'Barangay 183', 'San Jose'],
      },
      {
        name: 'Quezon City',
        code: '137404',
        postalCode: '1100',
        barangays: [
          'Bagumbayan',
          'Holy Spirit',
          'Batasan Hills',
          'Commonwealth',
          'Fairview',
        ],
      },
      {
        name: 'Manila',
        code: '133900',
        postalCode: '1000',
        barangays: ['Intramuros', 'Ermita', 'Malate', 'Binondo', 'Quiapo'], // 实际上马尼拉有几百个数字 Barangay，这里只列出名的
      },
    ],
  },
  {
    province: 'Cebu',
    code: '072200',
    cities: [
      {
        name: 'Cebu City',
        code: '072217',
        postalCode: '6000',
        barangays: ['Lahug', 'Mabolo', 'Guadalupe', 'Apas', 'Talamban'],
      },
      {
        name: 'Mandaue City',
        code: '072230',
        postalCode: '6014',
        barangays: ['Banilad', 'Centro', 'Bakilid', 'Tipolo'],
      },
      {
        name: 'Lapu-Lapu City',
        code: '072226',
        postalCode: '6015',
        barangays: ['Mactan', 'Punta Engaño', 'Marigondon'],
      },
    ],
  },
  {
    province: 'Cavite',
    code: '042100',
    cities: [
      {
        name: 'Bacoor',
        code: '042103',
        postalCode: '4102',
        barangays: ['Molino I', 'Molino II', 'Molino III', 'Panapaan'],
      },
      {
        name: 'Imus',
        code: '042104',
        postalCode: '4103',
        barangays: ['Poblacion', 'Bucandala', 'Malagasang'],
      },
    ],
  },
  {
    province: 'Davao del Sur',
    code: '112400',
    cities: [
      {
        name: 'Davao City',
        code: '112402',
        postalCode: '8000',
        barangays: [
          'Poblacion District',
          'Talomo District',
          'Agdao District',
          'Buhangin District',
        ],
      },
    ],
  },
];
