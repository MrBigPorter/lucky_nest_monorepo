import { LuckyDrawService } from './lucky-draw.service';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { WalletService } from '@api/client/wallet/wallet.service';
import { EventsGateway } from '@api/common/events/events.gateway';
import { SocketEvents } from '@lucky/shared';

describe('LuckyDrawService', () => {
  const dispatchToUserMock = jest.fn();

  const mockPrisma = {
    treasureGroup: {
      findUnique: jest.fn(),
    },
    luckyDrawActivity: {
      findFirst: jest.fn(),
    },
    luckyDrawTicket: {
      create: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockWallet = {} as WalletService;
  const mockEventsGateway = {
    dispatchToUser: dispatchToUserMock,
  } as unknown as EventsGateway;

  let service: LuckyDrawService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LuckyDrawService(mockPrisma, mockWallet, mockEventsGateway);
  });

  it('dispatches ticket-issued event when ticket is created for group member', async () => {
    (mockPrisma.treasureGroup.findUnique as jest.Mock).mockResolvedValue({
      treasureId: 'treasure_1',
      members: [{ userId: 'user_1', orderId: 'order_1' }],
    });
    (mockPrisma.luckyDrawActivity.findFirst as jest.Mock).mockResolvedValue({
      id: 'activity_1',
    });
    (mockPrisma.luckyDrawTicket.create as jest.Mock).mockResolvedValue({
      id: 'ticket_1',
      activityId: 'activity_1',
      orderId: 'order_1',
      createdAt: new Date('2026-03-19T00:00:00.000Z'),
    });

    await service.issueTicketsForGroup('group_1');

    expect(dispatchToUserMock).toHaveBeenCalledWith(
      'user_1',
      SocketEvents.LUCKY_DRAW_TICKET_ISSUED,
      expect.objectContaining({
        groupId: 'group_1',
        ticketId: 'ticket_1',
        activityId: 'activity_1',
        orderId: 'order_1',
      }),
    );
  });

  it('does not dispatch ticket-issued event when ticket creation fails', async () => {
    (mockPrisma.treasureGroup.findUnique as jest.Mock).mockResolvedValue({
      treasureId: 'treasure_1',
      members: [{ userId: 'user_1', orderId: 'order_1' }],
    });
    (mockPrisma.luckyDrawActivity.findFirst as jest.Mock).mockResolvedValue({
      id: 'activity_1',
    });
    (mockPrisma.luckyDrawTicket.create as jest.Mock).mockRejectedValue(
      new Error('duplicate ticket'),
    );

    await service.issueTicketsForGroup('group_1');

    expect(dispatchToUserMock).not.toHaveBeenCalled();
  });
});
