import {BadRequestException, ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import {PrismaService} from "@api/prisma/prisma.service";
import {GroupCreateDto} from "@api/group/dto/group-create.dto";
import {GROUP_STATUS, IS_OWNER, TREASURE_STATE} from "@lucky/shared/dist/types/treasure";
import {throwBiz} from "@api/common/exceptions/biz.exception";
import {ERROR_KEYS} from "@api/common/error-codes.gen";
import {GroupJoinDto} from "@api/group/dto/group-join.dto";
import {Prisma} from "@prisma/client";
import {GroupLeaveDto} from "@api/group/dto/group-leave.dto";

@Injectable()
export class GroupService {
    constructor(private readonly prisma: PrismaService) {
    }

    //创建团
    async createGroup(dto: GroupCreateDto){
       const {treasureId,groupName,maxMembers,orderId,leaderUserId} = dto;

       //先查宝箱是否有效
        const treasure = await this.prisma.treasure.findUnique({
            where: { treasureId},
            select: {state:true}
        })

        if (!treasure || treasure.state == TREASURE_STATE.INACTIVE){
            throw  new BadRequestException('Treasure not found or inactive');
        }

        // 业务防御：一个人是否允许在同宝箱下同时创建多个进行中的团
        const existing = await  this.prisma.treasureGroupMember.findFirst({
            where: {
                userId: leaderUserId,
                group: {
                    treasureId,
                    groupStatus: GROUP_STATUS.ACTIVE,
                },
            },
            select: {groupId:true}
        })

        if (existing){
            throwBiz(ERROR_KEYS.GROUP_ALREADY_EXISTS)
        }

        const  groupId = this.generateSnowflake();

        await this.prisma.$transaction(async (ctx)=>{
           // 开团
            await ctx.treasureGroup.create({
                data: {
                    groupId,
                    treasureId,
                    creatorId: leaderUserId,
                    groupName: groupName ?? '',
                    maxMembers,
                    currentMembers: 1,
                    groupStatus: GROUP_STATUS.ACTIVE,
                }
            })

            // 记录成员
            await ctx.treasureGroupMember.create({
                data: {
                    groupId,
                    userId: leaderUserId,
                    isOwner: IS_OWNER.YES,
                    orderId
                }
            })
        })
        return {groupId}
    }


    // 加入团
    async joinGroup(dto: GroupJoinDto){
       const {groupId,userId,orderId} = dto;

       return this.prisma.$transaction(async (ctx)=>{
           // 组存在而且可以加入
           const group = await ctx.treasureGroup.findUnique({
               where: {groupId},
               select: {
                   groupStatus: true,
               }
           })

           if (!group) throw new NotFoundException('Group not found');
           if (group.groupStatus == GROUP_STATUS.INACTIVE) throw new BadRequestException('Group is inactive');

           // 已经是成员
           const alreadyMember = await ctx.treasureGroupMember.findUnique({
               where: {
                   groupId_userId: {groupId,userId},
               },
               select: {
                   userId: true,
               }
           })
           if (alreadyMember) throw new BadRequestException('You are already in this group');

           //更新，并发容量控制
           const updated = await
               ctx.$queryRaw<{group_id: string, current_members: number, max_members: number}[]>(
                   Prisma.sql`
                       UPDATE treasure_group 
                       SET current_members = current_members + 1 
                       WHERE group_id = ${groupId} 
                         AND current_members < max_members
                       RETURNING group_id, current_members, max_members
                   `
               )
           //没有行被更新，说明满员
           if (updated.length == 0) throw new ConflictException('Group is full');

           // 插入成员
           await ctx.treasureGroupMember.create({
               data: {
                   groupId,
                   userId,
                   isOwner: IS_OWNER.NO,
                   orderId
               }
           })
           return {groupId}
       })
    }

    //退出团
    async leaveGroup(dto: GroupLeaveDto): Promise<void>{
        const {groupId,userId} = dto;

        await this.prisma.$transaction(async (ctx)=>{
            const member = await ctx.treasureGroupMember.findUnique({
                where: {groupId_userId: {groupId,userId}},
                select: {
                    isOwner: true,
                }
            })

            if (!member) throw new NotFoundException('Not a member of this group');

            //删除成员
            await ctx.treasureGroupMember.delete({
                where: {groupId_userId: {groupId,userId}},
            })

            // 人数 -1
            await  ctx.$executeRaw(
                Prisma.sql`
                    UPDATE treasure_group 
                    SET current_members = GREATEST(current_members - 1, 0)
                    WHERE group_id = ${groupId} 
                `
            )

            // 若离开的是团长 -> 转移团长或自动结束
            if (member.isOwner == IS_OWNER.YES){
                //查询最早加入的成员
                const nextOwner = await ctx.treasureGroupMember.findFirst({
                    where: {groupId},
                    orderBy: { joinedAt: 'asc'},
                    select: { userId: true}
                })

                if (nextOwner){
                    await ctx.treasureGroupMember.update({
                        where: {groupId_userId: {groupId, userId: nextOwner.userId}},
                        data: {isOwner: IS_OWNER.YES}
                    })
                    await ctx.treasureGroup.update({
                        where: { groupId},
                        data: { creatorId: nextOwner.userId}
                    })
                }else {
                    //无人就关闭
                    await ctx.treasureGroup.update({
                        where: {groupId},
                        data: {groupStatus: GROUP_STATUS.INACTIVE}
                    })
                }
            }
        })
    }

    private generateSnowflake(): string {
        return `${Date.now()}${Math.floor(Math.random() * 10000)}`
    }
}