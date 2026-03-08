import { Controller, Get, Query, Header, Logger } from '@nestjs/common';
import { TreasureService } from '@api/client/treasure/treasure.service'; // 注意路径，换成你实际的路径

@Controller()
export class ShareController {
  private readonly logger = new Logger(ShareController.name);

  constructor(private readonly treasureService: TreasureService) {}

  /**
   * 拦截 /share.html 请求，输出给 WhatsApp/FB 爬虫和普通用户
   */
  @Get('share.html')
  @Header('Content-Type', 'text/html; charset=utf-8') // 必须声明这是网页
  async getSharePage(@Query('pid') pid: string, @Query('gid') gid?: string) {
    // 1. 定义兜底网页：如果 pid 没传或者报错，给一张默认卡片
    const fallbackHtml = this.generateHtml(
      'Lucky App - Fortunate Journey',
      'Come and explore the best treasures on Lucky App!',
      'https://img.joyminis.com/images/joymini-banner.png',
      pid,
      gid,
    );

    if (!pid) return fallbackHtml;

    try {
      const product = await this.treasureService.detail(pid);

      if (!product) return fallbackHtml;

      // 3. 将查到的商品数据，塞进 HTML 模板里
      return this.generateHtml(
        product.treasureName,
        product.desc || 'Come and get it on Lucky App!',
        product?.treasureCoverImg ||
          'https://img.joyminis.com/images/joymini-banner.png',
        pid,
        gid,
      );
    } catch (error: any) {
      this.logger.warn(`Share page failed for pid ${pid}: ${error.message}`);
      return fallbackHtml; // 防止给爬虫报错
    }
  }

  /**
   * 私有方法：生成带有真实数据的 HTML 字符串
   */
  private generateHtml(
    title: string,
    desc: string,
    imageUrl: string,
    pid?: string,
    gid?: string,
  ): string {
    const schemeQuery = gid ? `?groupId=${gid}` : '';
    // 唤起你们的 App Scheme
    const jumpScheme = pid
      ? `luckyapp://product/${pid}${schemeQuery}`
      : 'luckyapp://home';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <title>${title} - Lucky App</title>
    
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${imageUrl}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 85vh; margin: 0; background: #fafafa; }
        .logo { width: 80px; height: 80px; border-radius: 18px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .open-btn { display: block; width: 220px; height: 50px; line-height: 50px; background: #FF5722; color: white; text-align: center; border-radius: 25px; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div class="logo" style="background: #FF5722; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 40px; font-weight: bold;">L</span>
    </div>
    <div style="font-size: 16px; color: #666; margin-bottom: 30px;">Redirecting to Lucky App...</div>
    <a href="javascript:void(0);" id="jumpBtn" class="open-btn">Open in App</a>

    <script>
        const scheme = '${jumpScheme}';
        
        function doJump() {
            window.location.href = scheme;
        }
        
        window.onload = function() { setTimeout(doJump, 800); };
        document.getElementById('jumpBtn').onclick = doJump;
    </script>
</body>
</html>
    `;
  }
}
