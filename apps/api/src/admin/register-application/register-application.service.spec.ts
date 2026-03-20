import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterApplicationService } from './register-application.service';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { PasswordService } from '@api/common/service/password.service';
import { EmailService } from '@api/common/email/email.service';
import { RecaptchaService } from '@api/common/recaptcha/recaptcha.service';
import { RedisService } from '@api/common/redis/redis.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  adminUser: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  adminRegisterApplication: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockPasswordService = { hash: jest.fn() };
const mockEmailService = {
  sendApplicationReceived: jest.fn(),
  sendApplicationApproved: jest.fn(),
  sendApplicationRejected: jest.fn(),
};
const mockRecaptchaService = { verify: jest.fn() };
const mockRedisService = { get: jest.fn(), set: jest.fn() };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeDto = (
  overrides: Partial<CreateApplicationDto> = {},
): CreateApplicationDto => ({
  username: 'john_doe',
  password: 'Password1',
  realName: 'John Doe',
  email: 'john@company.com',
  recaptchaToken: 'token_abc',
  ...overrides,
});

const pendingApp = {
  id: 'app-1',
  username: 'john_doe',
  password: 'hashed',
  realName: 'John Doe',
  email: 'john@company.com',
  applyReason: null,
  applyIp: '1.2.3.4',
  status: 'pending',
  reviewedBy: null,
  reviewNote: null,
  reviewedAt: null,
  createdAt: new Date('2026-03-17T00:00:00Z'),
  updatedAt: new Date('2026-03-17T00:00:00Z'),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('RegisterApplicationService', () => {
  let service: RegisterApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterApplicationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: RecaptchaService, useValue: mockRecaptchaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RegisterApplicationService>(
      RegisterApplicationService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    beforeEach(() => {
      // Happy-path defaults
      mockRecaptchaService.verify.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue(null); // 0 previous attempts
      mockRedisService.set.mockResolvedValue('OK');
      mockPrisma.adminUser.findUnique.mockResolvedValue(null); // username free
      mockPrisma.adminRegisterApplication.findFirst.mockResolvedValue(null); // no dup
      mockPasswordService.hash.mockResolvedValue('hashed_pw');
      mockPrisma.adminRegisterApplication.create.mockResolvedValue({
        ...pendingApp,
        id: 'new-app-id',
      });
      mockEmailService.sendApplicationReceived.mockResolvedValue(undefined);
    });

    it('happy path — returns id + message', async () => {
      const result = await service.create(makeDto(), '1.2.3.4');
      expect(result.id).toBe('new-app-id');
      expect(result.message).toMatch(/submitted/i);
    });

    it('calls reCAPTCHA verify with correct action', async () => {
      await service.create(makeDto({ recaptchaToken: 'tok_xyz' }), '1.2.3.4');
      expect(mockRecaptchaService.verify).toHaveBeenCalledWith(
        'tok_xyz',
        'admin_apply',
      );
    });

    it('throws ForbiddenException when IP limit reached (≥3)', async () => {
      mockRedisService.get.mockResolvedValue('3');
      await expect(service.create(makeDto(), '9.9.9.9')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('increments IP counter on first request (sets with TTL)', async () => {
      mockRedisService.get.mockResolvedValue(null);
      await service.create(makeDto(), '5.5.5.5');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'apply:ip:5.5.5.5',
        '1',
        86_400,
      );
    });

    it('increments IP counter from existing count', async () => {
      mockRedisService.get.mockResolvedValue('2');
      await service.create(makeDto(), '5.5.5.5');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'apply:ip:5.5.5.5',
        '3',
        86_400,
      );
    });

    it('throws BadRequestException for disposable email domain', async () => {
      await expect(
        service.create(makeDto({ email: 'test@mailinator.com' }), '1.2.3.4'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when username already exists in AdminUser', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.create(makeDto(), '1.2.3.4')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when pending application with same username exists', async () => {
      mockPrisma.adminRegisterApplication.findFirst.mockResolvedValue({
        ...pendingApp,
        username: 'john_doe',
        email: 'other@company.com',
      });
      await expect(service.create(makeDto(), '1.2.3.4')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when pending application with same email exists', async () => {
      mockPrisma.adminRegisterApplication.findFirst.mockResolvedValue({
        ...pendingApp,
        username: 'other_user',
        email: 'john@company.com',
      });
      await expect(service.create(makeDto(), '1.2.3.4')).rejects.toThrow(
        ConflictException,
      );
    });

    it('hashes the password before storing', async () => {
      await service.create(makeDto({ password: 'RawPass1' }), '1.2.3.4');
      expect(mockPasswordService.hash).toHaveBeenCalledWith('RawPass1');
      expect(mockPrisma.adminRegisterApplication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'hashed_pw' }),
        }),
      );
    });

    it('sends acknowledgement email (fire-and-forget — resolves without error)', async () => {
      await service.create(makeDto(), '1.2.3.4');
      // allow microtask queue to flush
      await Promise.resolve();
      expect(mockEmailService.sendApplicationReceived).toHaveBeenCalledWith(
        'john@company.com',
        'John Doe',
      );
    });

    it('does NOT throw even if email sending fails', async () => {
      mockEmailService.sendApplicationReceived.mockRejectedValue(
        new Error('SMTP down'),
      );
      await expect(service.create(makeDto(), '1.2.3.4')).resolves.toBeDefined();
    });
  });

  // ─── findAll() ─────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation(
        async ([countQuery, findQuery]: [
          Promise<number>,
          Promise<unknown[]>,
        ]) => {
          return [await countQuery, await findQuery];
        },
      );
      mockPrisma.adminRegisterApplication.count.mockResolvedValue(0);
      mockPrisma.adminRegisterApplication.findMany.mockResolvedValue([]);
    });

    it('returns paginated structure with defaults', async () => {
      mockPrisma.adminRegisterApplication.count.mockResolvedValue(5);
      mockPrisma.adminRegisterApplication.findMany.mockResolvedValue([
        { ...pendingApp, createdAt: new Date(), reviewedAt: null },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(Array.isArray(result.list)).toBe(true);
    });

    it('converts createdAt to timestamp (number)', async () => {
      const date = new Date('2026-03-17T00:00:00Z');
      mockPrisma.adminRegisterApplication.count.mockResolvedValue(1);
      mockPrisma.adminRegisterApplication.findMany.mockResolvedValue([
        { ...pendingApp, createdAt: date, reviewedAt: null },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.list[0].createdAt).toBe(date.getTime());
    });

    it('converts reviewedAt null to null', async () => {
      mockPrisma.adminRegisterApplication.count.mockResolvedValue(1);
      mockPrisma.adminRegisterApplication.findMany.mockResolvedValue([
        { ...pendingApp, createdAt: new Date(), reviewedAt: null },
      ]);
      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.list[0].reviewedAt).toBeNull();
    });

    it('filters by status=approved', async () => {
      await service.findAll({ page: 1, pageSize: 10, status: 'approved' });
      expect(mockPrisma.adminRegisterApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'approved' } }),
      );
    });

    it('status=all removes status filter', async () => {
      await service.findAll({ page: 1, pageSize: 10, status: 'all' });
      expect(mockPrisma.adminRegisterApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filters by username (case-insensitive)', async () => {
      await service.findAll({ page: 1, pageSize: 10, username: 'john' });
      expect(mockPrisma.adminRegisterApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            username: { contains: 'john', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('calculates correct skip for page 3 / pageSize 10', async () => {
      await service.findAll({ page: 3, pageSize: 10 });
      expect(mockPrisma.adminRegisterApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('totalPages rounds up correctly', async () => {
      mockPrisma.adminRegisterApplication.count.mockResolvedValue(21);
      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.totalPages).toBe(2);
    });
  });

  // ─── pendingCount() ────────────────────────────────────────────────────────

  describe('pendingCount()', () => {
    it('returns { count }', async () => {
      mockPrisma.adminRegisterApplication.count.mockResolvedValue(7);
      const result = await service.pendingCount();
      expect(result).toEqual({ count: 7 });
    });

    it('queries only status=pending', async () => {
      mockPrisma.adminRegisterApplication.count.mockResolvedValue(0);
      await service.pendingCount();
      expect(mockPrisma.adminRegisterApplication.count).toHaveBeenCalledWith({
        where: { status: 'pending' },
      });
    });
  });

  // ─── approve() ─────────────────────────────────────────────────────────────

  describe('approve()', () => {
    beforeEach(() => {
      mockPrisma.adminRegisterApplication.findUnique.mockResolvedValue(
        pendingApp,
      );
      mockPrisma.adminUser.findUnique.mockResolvedValue(null); // no conflict
      mockPrisma.$transaction.mockImplementation(
        async (fn: (ctx: typeof mockPrisma) => Promise<void>) => {
          await fn(mockPrisma);
        },
      );
      mockPrisma.adminUser.create.mockResolvedValue({});
      mockPrisma.adminRegisterApplication.update.mockResolvedValue({});
      mockEmailService.sendApplicationApproved.mockResolvedValue(undefined);
    });

    it('happy path — returns success message', async () => {
      const result = await service.approve('app-1', 'reviewer-1');
      expect(result.message).toMatch(/approved/i);
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.adminRegisterApplication.findUnique.mockResolvedValue(null);
      await expect(service.approve('no-id', 'r-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if application already approved', async () => {
      mockPrisma.adminRegisterApplication.findUnique.mockResolvedValue({
        ...pendingApp,
        status: 'approved',
      });
      await expect(service.approve('app-1', 'r-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException if username was taken after submission', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue({
        id: 'conflict-user',
      });
      await expect(service.approve('app-1', 'r-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates AdminUser inside transaction', async () => {
      await service.approve('app-1', 'reviewer-1');
      expect(mockPrisma.adminUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'john_doe',
            password: 'hashed',
          }),
        }),
      );
    });

    it('marks application as approved with reviewedBy', async () => {
      await service.approve('app-1', 'reviewer-1');
      expect(mockPrisma.adminRegisterApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({
            status: 'approved',
            reviewedBy: 'reviewer-1',
          }),
        }),
      );
    });

    it('sends approval email (fire-and-forget)', async () => {
      await service.approve('app-1', 'reviewer-1');
      await Promise.resolve();
      expect(mockEmailService.sendApplicationApproved).toHaveBeenCalledWith(
        'john@company.com',
        'John Doe',
        'john_doe',
      );
    });
  });

  // ─── reject() ──────────────────────────────────────────────────────────────

  describe('reject()', () => {
    const reviewDto: ReviewApplicationDto = { reviewNote: 'Not eligible' };

    beforeEach(() => {
      mockPrisma.adminRegisterApplication.findUnique.mockResolvedValue(
        pendingApp,
      );
      mockPrisma.adminRegisterApplication.update.mockResolvedValue({});
      mockEmailService.sendApplicationRejected.mockResolvedValue(undefined);
    });

    it('happy path — returns success message', async () => {
      const result = await service.reject('app-1', reviewDto, 'reviewer-1');
      expect(result.message).toMatch(/rejected/i);
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.adminRegisterApplication.findUnique.mockResolvedValue(null);
      await expect(service.reject('no-id', reviewDto, 'r-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if application already rejected', async () => {
      mockPrisma.adminRegisterApplication.findUnique.mockResolvedValue({
        ...pendingApp,
        status: 'rejected',
      });
      await expect(service.reject('app-1', reviewDto, 'r-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates application with status=rejected, reviewNote, reviewedBy', async () => {
      await service.reject('app-1', reviewDto, 'reviewer-1');
      expect(mockPrisma.adminRegisterApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({
            status: 'rejected',
            reviewedBy: 'reviewer-1',
            reviewNote: 'Not eligible',
          }),
        }),
      );
    });

    it('sends rejection email (fire-and-forget)', async () => {
      await service.reject('app-1', reviewDto, 'reviewer-1');
      await Promise.resolve();
      expect(mockEmailService.sendApplicationRejected).toHaveBeenCalledWith(
        'john@company.com',
        'John Doe',
        'Not eligible',
      );
    });

    it('accepts empty reviewNote', async () => {
      const dto: ReviewApplicationDto = { reviewNote: '' };
      const result = await service.reject('app-1', dto, 'reviewer-1');
      expect(result.message).toMatch(/rejected/i);
    });
  });

  // ─── Email domain blocklist (validateEmailDomain) ──────────────────────────

  describe('email domain blocklist', () => {
    const BLOCKED = [
      'mailinator.com',
      'guerrillamail.com',
      'temp-mail.org',
      'yopmail.com',
      '10minutemail.com',
      'trashmail.com',
    ];

    it.each(BLOCKED)('blocks disposable domain: %s', async (domain) => {
      await expect(
        service.create(makeDto({ email: `user@${domain}` }), '1.2.3.4'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows legitimate domains', async () => {
      // all mocks set to happy path in outer beforeEach
      mockRecaptchaService.verify.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);
      mockPrisma.adminRegisterApplication.findFirst.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed_pw');
      mockPrisma.adminRegisterApplication.create.mockResolvedValue({
        ...pendingApp,
        id: 'x',
      });
      mockEmailService.sendApplicationReceived.mockResolvedValue(undefined);

      await expect(
        service.create(makeDto({ email: 'user@gmail.com' }), '1.2.3.4'),
      ).resolves.toBeDefined();
    });
  });
});
