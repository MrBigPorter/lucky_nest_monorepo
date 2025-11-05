import {BadRequestException, ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import {PrismaService} from "@api/prisma/prisma.service";
import {GroupCreateDto} from "@api/group/dto/group-create.dto";
import {GROUP_STATUS, IS_OWNER, TREASURE_STATE} from "@lucky/shared/dist/types/treasure";
import {throwBiz} from "@api/common/exceptions/biz.exception";
import {ERROR_KEYS} from "@api/common/error-codes.gen";
import {GroupJoinDto} from "@api/group/dto/group-join.dto";
import {Prisma} from "@prisma/client";
import {GroupLeaveDto} from "@api/group/dto/group-leave.dto";
import {GroupListForTreasureDto} from "@api/group/dto/group-list-for-treasure.dto";

@Injectable()
export class GroupService {
    constructor(private readonly prisma: PrismaService) {
    }

    //创建团
    async createGroup(dto: GroupCreateDto) {
        const {treasureId, groupName, maxMembers, orderId, leaderUserId} = dto;

        //先查宝箱是否有效
        const treasure = await this.prisma.treasure.findUnique({
            where: {treasureId},
            select: {state: true}
        })

        if (!treasure || treasure.state == TREASURE_STATE.INACTIVE) {
            throw new BadRequestException('Treasure not found or inactive');
        }

        // 业务防御：一个人是否允许在同宝箱下同时创建多个进行中的团
        const existing = await this.prisma.treasureGroupMember.findFirst({
            where: {
                userId: leaderUserId,
                group: {
                    treasureId,
                    groupStatus: GROUP_STATUS.ACTIVE,
                },
            },
            select: {groupId: true}
        })

        if (existing) {
            throwBiz(ERROR_KEYS.GROUP_ALREADY_EXISTS)
        }


       const {groupId} =  await this.prisma.$transaction(async (ctx) => {
            // 开团
            const g = await ctx.treasureGroup.create({
                data: {
                    treasureId,
                    creatorId: leaderUserId,
                    groupName: groupName ?? '',
                    ...(typeof maxMembers === 'number' ? {maxMembers} : {}),
                    currentMembers: 1,
                    groupStatus: GROUP_STATUS.ACTIVE,
                },
                select: {
                    groupId: true,
                }
            })

            // 记录成员
            await ctx.treasureGroupMember.create({
                data: {
                    groupId:g.groupId,
                    userId: leaderUserId,
                    isOwner: IS_OWNER.YES,
                    orderId
                }
            })

           return g;
        })
        return {groupId}
    }


    // 加入团
    async joinGroup(dto: GroupJoinDto) {
        const {groupId, userId, orderId} = dto;

        return this.prisma.$transaction(async (ctx) => {
            // 组存在而且可以加入
            const group = await ctx.treasureGroup.findUnique({
                where: {groupId},
                select: {
                    groupStatus: true,
                    treasureId: true,
                }
            })

            if (!group) throw new NotFoundException('Group not found');
            if (group.groupStatus == GROUP_STATUS.INACTIVE) throw new BadRequestException('Group is inactive');


            // 2) 并发安全占位（满员则 0 行受影响）
            const updated = await
                ctx.$queryRaw<{ ok: number }[]>(
                    Prisma.sql`
                        UPDATE treasure_groups
                        SET current_members = current_members + 1
                        WHERE group_id = ${groupId}
                          AND current_members < max_members RETURNING 1 AS ok
                    `
                )
            //没有行被更新，说明满员
            if (updated.length == 0) throw new ConflictException('Group is full');

            try {
                // 3) 插入成员；若重复入团命中唯一键 => 冲突
                await ctx.treasureGroupMember.create({
                    data: {
                        groupId,
                        userId,
                        isOwner: IS_OWNER.NO,
                        orderId
                    }
                })
            } catch (e) {
                // 唯一键冲突，人数回滚
                const isP2002 = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
                if (isP2002) {
                    await ctx.$executeRaw(
                        Prisma.sql`
                            UPDATE treasure_groups
                            SET current_members = GREATEST(current_members - 1, 0)
                            WHERE group_id = ${groupId}
                        `
                    );
                    throw new ConflictException('you are already in this group');
                }
                throw e;
            }


            return {groupId}
        })
    }

    //退出团
    async leaveGroup(dto: GroupLeaveDto): Promise<void> {
        const {groupId, userId} = dto;

        await this.prisma.$transaction(async (ctx) => {
            const member = await ctx.treasureGroupMember.findUnique({
                where: {groupId_userId: {groupId, userId}},
                select: {
                    isOwner: true,
                }
            })

            if (!member) throw new NotFoundException('Not a member of this group');

            // 若离开的是团长 -> 转移团长或自动结束
            if (member.isOwner == IS_OWNER.YES) {
                //查询最早加入的成员
                const nextOwner = await ctx.treasureGroupMember.findFirst({
                    where: {groupId},
                    orderBy: {joinedAt: 'asc'},
                    select: {userId: true}
                })

                if (nextOwner) {
                    await ctx.treasureGroupMember.update({
                        where: {groupId_userId: {groupId, userId: nextOwner.userId}},
                        data: {isOwner: IS_OWNER.YES}
                    })
                    await ctx.treasureGroup.update({
                        where: {groupId},
                        data: {creatorId: nextOwner.userId}
                    })
                } else {
                    //无人就关闭
                    await ctx.treasureGroup.update({
                        where: {groupId},
                        data: {groupStatus: GROUP_STATUS.INACTIVE}
                    })
                }
            }

            //删除成员
            await ctx.treasureGroupMember.delete({
                where: {groupId_userId: {groupId, userId}},
            })

            // 人数 -1
            await ctx.$executeRaw(
                Prisma.sql`
                    UPDATE treasure_groups
                    SET current_members = GREATEST(current_members - 1, 0)
                    WHERE group_id = ${groupId}
                `
            );

        })
    }

    // 组团列表
    async listGroupForTreasure(dto: GroupListForTreasureDto) {
        const {treasureId, page, pageSize} = dto;


        const [total, groups] = await this.prisma.$transaction([
            this.prisma.treasureGroup.count({
                where: {treasureId, groupStatus: GROUP_STATUS.ACTIVE},
            }),
            this.prisma.treasureGroup.findMany({
                where: {treasureId, groupStatus: GROUP_STATUS.ACTIVE},
                orderBy: [{updatedAt: 'desc'}, {groupId: 'desc'}],
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    creator: {
                        select: {
                            id: true,
                            nickname: true,
                            avatar: true,
                        }
                    },
                    members: {
                        orderBy: [{isOwner: 'desc'}, {joinedAt: 'asc'}],
                        // 每个组只取前 8 个成员预览；顺序：团长在前，其余按加入时间
                        take: 8,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    nickname: true,
                                    avatar: true,
                                }
                            }
                        }
                    },
                    _count: {select: {members: true}}
                }
            })
        ])

        return {
            page,
            pageSize,
            total,
            list: groups
        }

    }

    private generateSnowflake(): string {
        return `${Date.now()}${Math.floor(Math.random() * 10000)}`
    }
}