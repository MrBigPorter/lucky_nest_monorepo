import dayjs from "dayjs";

// ==========================================
// 1.  加载语言包 (按需添加)
// ==========================================
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";
// import 'dayjs/locale/ja';

// ==========================================
// 2. 加载插件
// ==========================================
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import customParseFormat from "dayjs/plugin/customParseFormat";

// ==========================================
// 3. 🔌 注册插件
// ==========================================
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(quarterOfYear);
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

// ==========================================
// 4. 基础设施设置
// ==========================================
// 强制锁定服务器时区为上海，防止 Docker/服务器时区差异导致数据偏移
dayjs.tz.setDefault("Asia/Shanghai");

// 默认语言设为英文 (为了后端并发安全，不要在这里设为中文)
// 前端会在初始化时覆盖它，后端则通过传参控制
dayjs.locale("en");

export default dayjs;
