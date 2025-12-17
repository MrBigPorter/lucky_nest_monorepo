import dayjs from "dayjs";

// ==========================================
// 1. 加载语言包
// ==========================================
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";

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
import isBetween from "dayjs/plugin/isBetween";

// ==========================================
// 3. 注册插件
// ==========================================
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(quarterOfYear);
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

// ==========================================
// 4. 基础设施设置
// ==========================================
// 锁定业务时区，防止服务器（UTC）与业务（Asia/Shanghai）时间差导致对账错误
dayjs.tz.setDefault("Asia/Shanghai");

// 默认设为英文，防止服务端并发污染全局语言
dayjs.locale("en");

export default dayjs;
