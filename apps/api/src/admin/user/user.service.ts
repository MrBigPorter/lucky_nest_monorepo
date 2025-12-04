import {BadRequestException, ForbiddenException, Injectable} from "@nestjs/common";
import {Prisma} from "@prisma/client";
import {PrismaService} from "@api/common/prisma/prisma.service";
import {AdminListDto} from "@api/admin/user/dto/admin-list.dto";
import {CreateAdminDto} from "@api/admin/user/dto/create-admin.dto";
import {ADMIN_USER_STATUS, Role} from "@lucky/shared";
import {UpdateAdminDto} from "@api/admin/user/dto/update-admin.dto";
import {PasswordService} from "@api/common/service/password.service";

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private passwordService: PasswordService
    ) {
    }

    /**
     * 管理员列表 -- admin list
     * @param query
     */
    async adminList(query: AdminListDto) {
        const {page = 1, pageSize = 10, username, realName, role, status} = query;
        const skip = (page - 1) * pageSize;

        // 1. 构建查询条件
        const where: Prisma.AdminUserWhereInput = {};

        // 模糊查询
        if (username) where.username = {contains: username, mode: 'insensitive'}
        if (realName) where.realName = {contains: realName, mode: 'insensitive'};


        if (role) where.role = role;
        if (status !== undefined) where.status = status;

        // 2. 并行查询：总数 + 当前页数据
        const [total, list] = await this.prisma.$transaction([
            this.prisma.adminUser.count({where}),
            this.prisma.adminUser.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {createdAt: 'desc'},
                select: {
                    id: true,
                    username: true,
                    realName: true,
                    role: true,
                    status: true,
                    lastLoginAt: true,
                    lastLoginIp: true,
                    createdAt: true
                }
            })
        ])
        return {
            total,
            pageSize,
            page,
            totalPages: Math.ceil(total / pageSize),
            list:list.map((item)=> ({
                ...item,
                createdAt:item.createdAt.getTime(),
                lastLoginAt: item?.lastLoginAt?.getTime() || null
            }))
        }
    }

    /**
     * 创建管理员 -- create admin
     * @param dto
     */
    async create(dto: CreateAdminDto){
        //查重
        const exists = await this.prisma.adminUser.findUnique({
            where:{username: dto.username}
        })
        if (exists)  throw new BadRequestException('username already exists');

        const hashedPassword = await this.passwordService.hash(dto.password || '123456');

        const user = await this.prisma.adminUser.create({
            data:{
                username: dto.username,
                password: hashedPassword,
                realName: dto.realName,
                role: dto.role,
                status: ADMIN_USER_STATUS.ACTIVE
            },
            select:{
                id: true,
                username: true,
                realName: true,
                role: true,
                status: true,
                createdAt: true
            }
        })
        return {
            ...user,
            createdAt: user.createdAt.getTime()
        }
    }

    /**
     * 更新管理员 -- update admin
     * @param id
     * @param dto
     * @param userId
     */
    async update(id: string, dto: UpdateAdminDto, userId: string){
        // 比较编辑的id 和 当前登录的user id 是不是同一个人
        if (id === userId && ( dto.status === ADMIN_USER_STATUS.INACTIVE || dto.role)){
            throw new ForbiddenException('cannot update yourself')
        }

        if (dto.password){
            dto.password = await this.passwordService.hash(dto.password);
        }

        return this.prisma.adminUser.update({
            where:{id},
            data: dto
        })
    }

    /**
     * 删除管理员 -- delete admin
     * @param id
     */
    async remove(id: string){
        // 检查是不是超级管理员
        const admin = await this.prisma.adminUser.findUnique({
            where: {id},
            select:{
                role: true
            }
        })
        if (!admin) throw new BadRequestException('admin not found');
        if (admin.role === Role.SUPER_ADMIN) throw new ForbiddenException('cannot delete super admin');

        // inactive account
        return this.prisma.adminUser.update({
            where: { id },
            data: {
                status: ADMIN_USER_STATUS.INACTIVE,
                username: `deleted_${id}_${Date.now()}` // 防止占用用户名
            }
        })
    }

    /**
     * 获取管理员详情 -- get admin detail
     * @param id
     */
    async findOne(id: string){
        return this.prisma.adminUser.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                username: true,
                realName: true,
                role: true,
                status: true,
                lastLoginAt: true,
                lastLoginIp: true
            }
        })
    }
}