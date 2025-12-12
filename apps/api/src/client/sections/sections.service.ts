import { Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { mapTreasure } from './mapper';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeSections(limit = 8) {
    // 1) 读分区定义
    const sections = await this.prisma.actSection.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });

    const out: any[] = [];

    console.log('Fetched sections:', sections);

    for (const s of sections) {
      let rows: any[] = [];
      const take = Number(s.limit ?? limit);

      // 找出每个分类
      if (s.key === 'home_special') {
        // 2) 专区：按绑定顺序取指定宝箱，严格保序
        // 根据section id 去找到所有 含有section ID 的列表，然后得到所有的 treasure ID
        const binds = await this.prisma.actSectionItem.findMany({
          where: { sectionId: s.id },
          orderBy: { sortOrder: 'asc' },
        });
        //找到所有的treasure ID
        const ids = binds.map((b) => String(b.treasureId));

        //通过id 去批量查找treasure
        if (ids.length > 0) {
          rows = await this.prisma.$queryRawUnsafe<any[]>(
            `
                            SELECT t.*
                            FROM treasures t
                            WHERE t.state = 1
                              AND t.treasure_id::text = ANY($1::text[])
                            ORDER BY array_position($1::text[], t.treasure_id::text)
                                LIMIT $2
                        `,
            ids,
            take,
          );
        }
      } else if (s.key === 'home_ending') {
        // 3) 即将开奖：未来场次优先，开奖时间越近越前；无上架数置后；再按进度
        rows = await this.prisma.$queryRawUnsafe<any[]>(
          `
                        SELECT t.*
                        FROM treasures t
                        WHERE t.state = 1
                        ORDER BY
                            CASE WHEN t.lottery_time IS NOT NULL AND t.lottery_time > NOW() THEN 0 ELSE 1 END,
                            t.lottery_time ASC NULLS LAST,
                            CASE WHEN NULLIF(t.seq_shelves_quantity, 0) IS NULL THEN 1 ELSE 0 END,
                            (t.seq_buy_quantity::numeric / NULLIF(t.seq_shelves_quantity, 0)::numeric) DESC NULLS LAST
                            LIMIT $1
                    `,
          take,
        );
      } else if (s.key === 'home_featured') {
        // 4) Featured：最近创建优先，其次看进度
        rows = await this.prisma.$queryRawUnsafe<any[]>(
          `
                        SELECT t.*
                        FROM treasures t
                        WHERE t.state = 1
                        ORDER BY t.created_at DESC NULLS LAST,
                                 (t.seq_buy_quantity::numeric / NULLIF(t.seq_shelves_quantity, 0)::numeric) DESC NULLS LAST
                            LIMIT $1
                    `,
          take,
        );
      } else if (s.key === 'home_recommend') {
        // 5) Recommend：没有 hot_score_7d 就用“进度 + 最近活跃”兜底
        rows = await this.prisma.$queryRawUnsafe<any[]>(
          `
                        SELECT t.*
                        FROM treasures t
                        WHERE t.state = 1
                        ORDER BY
                            (t.seq_buy_quantity::numeric / NULLIF(t.seq_shelves_quantity, 0)::numeric) DESC NULLS LAST,
                            t.updated_at DESC NULLS LAST
                            LIMIT $1
                    `,
          take,
        );
      }

      out.push({
        act_id: Number(s.id) || 0,
        img_style_type: Number(s.imgStyleType),
        treasure_resp: rows.map(mapTreasure),
      });
    }

    return out;
  }
}
