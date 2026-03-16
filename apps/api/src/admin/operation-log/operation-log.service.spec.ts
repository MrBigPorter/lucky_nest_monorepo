import { Test, TestingModule } from '@nestjs/testing';
import { OperationLogService } from './operation-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { describe } from 'vitest';

describe('OperationLogService', () => {
  let service: OperationLogService;
  let prisma: PrismaService;

  const mockPrismaService = {
    adminOperationLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationLogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OperationLogService>(OperationLogService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getList', () => {
    it('should return paginated operation logs with default params', async () => {
      const mockLogs = [
        {
          id: '1',
          adminUserId: 'admin-1',
          operationType: 'LOGIN',
          description: 'Admin login',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          adminUser: {
            id: 'admin-1',
            username: 'testadmin',
            email: 'test@example.com',
          },
        },
      ];

      mockPrismaService.adminOperationLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(1);

      const query: QueryOperationLogDto = {
        page: 1,
        pageSize: 10,
      };

      const result = await service.getList(query);

      expect(result).toEqual({
        list: mockLogs,
        total: 1,
        page: 1,
        pageSize: 10,
      });

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        {
          where: {},
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            adminUser: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      );
    });

    it('should filter by adminId', async () => {
      mockPrismaService.adminOperationLog.findMany.mockResolvedValue([]);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(0);

      const query: QueryOperationLogDto = {
        page: 1,
        pageSize: 10,
        adminId: 'admin-123',
      };

      await service.getList(query);

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            adminUserId: 'admin-123',
          },
        }),
      );
    });

    it('should filter by operationType', async () => {
      mockPrismaService.adminOperationLog.findMany.mockResolvedValue([]);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(0);

      const query: QueryOperationLogDto = {
        page: 1,
        pageSize: 10,
        operationType: 'AUDIT',
      };

      await service.getList(query);

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            operationType: 'AUDIT',
          },
        }),
      );
    });

    it('should ignore operationType filter when value is ALL', async () => {
      mockPrismaService.adminOperationLog.findMany.mockResolvedValue([]);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(0);

      const query: QueryOperationLogDto = {
        page: 1,
        pageSize: 10,
        operationType: 'ALL',
      };

      await service.getList(query);

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should filter by keyword', async () => {
      mockPrismaService.adminOperationLog.findMany.mockResolvedValue([]);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(0);

      const query: QueryOperationLogDto = {
        page: 1,
        pageSize: 10,
        keyword: 'test',
      };

      await service.getList(query);

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { description: { contains: 'test' } },
              { targetId: { contains: 'test' } },
              { adminUser: { username: { contains: 'test' } } },
            ],
          },
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.adminOperationLog.findMany.mockResolvedValue([]);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(0);

      const startDate = '2026-03-01';
      const endDate = '2026-03-16';

      const query: QueryOperationLogDto = {
        page: 1,
        pageSize: 10,
        startDate,
        endDate,
      };

      await service.getList(query);

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.adminOperationLog.findMany.mockResolvedValue([]);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(0);

      const query: QueryOperationLogDto = {
        page: 3,
        pageSize: 20,
      };

      await service.getList(query);

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3 - 1) * 20
          take: 20,
        }),
      );
    });

    it('should combine multiple filters', async () => {
      mockPrismaService.adminOperationLog.findMany.mockResolvedValue([]);
      mockPrismaService.adminOperationLog.count.mockResolvedValue(0);

      const query: QueryOperationLogDto = {
        page: 1,
        pageSize: 10,
        adminId: 'admin-123',
        operationType: 'UPDATE',
        keyword: 'product',
        startDate: '2026-03-01',
        endDate: '2026-03-16',
      };

      await service.getList(query);

      expect(mockPrismaService.adminOperationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            adminUserId: 'admin-123',
            operationType: 'UPDATE',
            OR: [
              { description: { contains: 'product' } },
              { targetId: { contains: 'product' } },
              { adminUser: { username: { contains: 'product' } } },
            ],
            createdAt: {
              gte: new Date('2026-03-01'),
              lte: new Date('2026-03-16'),
            },
          },
        }),
      );
    });
  });
});
