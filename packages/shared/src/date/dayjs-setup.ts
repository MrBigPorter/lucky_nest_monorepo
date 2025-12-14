import dayjs from "dayjs";
import "dayjs/locale/en"; // 或者 'zh-cn'，根据你的国际化需求
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

// 1. 加载插件
dayjs.extend(relativeTime); // 支持 .fromNow()
dayjs.extend(updateLocale);

// 2. 全局设置 (可选)
// 如果你需要强制全系统使用菲律宾英语习惯，可以在这里配置
// dayjs.locale('en');

export default dayjs;
