import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { describe } from 'vitest';

describe('Operation Log API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test admin user and login to get token
    const testAdmin = await prisma.adminUser.upsert({
      where: { username: 'test-admin-oplog' },
      update: {},
      create: {
        username: 'test-admin-oplog',
        password: '$2a$10$test.hash', // bcrypt hash
        email: 'test-oplog@example.com',
        role: 'ADMIN',
      },
    });

    // Mock login to get token (you may need to adjust this based on your auth setup)
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/admin/login')
      .send({
        username: 'test-admin-oplog',
        password: 'test123',
      });

    if (loginResponse.body.token) {
      adminToken = loginResponse.body.token;
    } else {
      // Fallback: generate a test token manually if needed
      adminToken = 'test-token';
    }

    // Create test operation logs
    await prisma.adminOperationLog.createMany({
      data: [
        {
          adminUserId: testAdmin.id,
          operationType: 'LOGIN',
          description: 'Admin logged in',
          ipAddress: '127.0.0.1',
        },
        {
          adminUserId: testAdmin.id,
          operationType: 'UPDATE',
          description: 'Updated product',
          targetId: 'product-123',
          ipAddress: '127.0.0.1',
        },
        {
          adminUserId: testAdmin.id,
          operationType: 'AUDIT',
          description: 'Audited KYC',
          targetId: 'kyc-456',
          ipAddress: '192.168.1.1',
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.adminOperationLog.deleteMany({
      where: {
        adminUser: {
          username: 'test-admin-oplog',
        },
      },
    });
    await prisma.adminUser.delete({
      where: { username: 'test-admin-oplog' },
    });

    await app.close();
  });

  describe('GET /v1/admin/operation-logs/list', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/operation-logs/list')
        .expect(401);
    });

    it('should return paginated operation logs', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/operation-logs/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, pageSize: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('list');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('pageSize', 10);
          expect(Array.isArray(res.body.list)).toBe(true);
        });
    });

    it('should filter by operationType', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/operation-logs/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ operationType: 'LOGIN' })
        .expect(200)
        .expect((res) => {
          expect(res.body.list.length).toBeGreaterThan(0);
          res.body.list.forEach((log: any) => {
            expect(log.operationType).toBe('LOGIN');
          });
        });
    });

    it('should filter by keyword', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/operation-logs/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ keyword: 'product' })
        .expect(200)
        .expect((res) => {
          expect(res.body.list.length).toBeGreaterThan(0);
          const hasMatch = res.body.list.some((log: any) =>
            log.description.toLowerCase().includes('product'),
          );
          expect(hasMatch).toBe(true);
        });
    });

    it('should include adminUser information', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/operation-logs/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, pageSize: 1 })
        .expect(200)
        .expect((res) => {
          expect(res.body.list[0]).toHaveProperty('adminUser');
          expect(res.body.list[0].adminUser).toHaveProperty('id');
          expect(res.body.list[0].adminUser).toHaveProperty('username');
        });
    });

    it('should validate page parameter', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/operation-logs/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 0 }) // Invalid: must be >= 1
        .expect(400);
    });

    it('should validate pageSize parameter', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/operation-logs/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ pageSize: 0 }) // Invalid: must be >= 1
        .expect(400);
    });
  });
});
