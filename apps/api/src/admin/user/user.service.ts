import {Injectable} from "@nestjs/common";
import {Prisma} from "@prisma/client";
import {PrismaService} from "@api/common/prisma/prisma.service";
import {AdminListDto} from "@api/admin/user/dto/admin-list.dto";


@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {
    }
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
            list
        }
    }

}