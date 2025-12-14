import { OpModule, OpAction } from "../constants/operation-log.constants";
import { Role } from "../types/enums";
/**
 * 核心逻辑：这里决定了 ADMIN 能不能 VIEW
 */
export const RolePermissions = {
  // ------------------------------------------
  //  ADMIN (普通管理员)
  // ------------------------------------------
  [Role.ADMIN]: [
    //  1. 用户模块权限
    `${OpModule.USER}:${OpAction.USER.VIEW}`, // "user_management:view_user"
    `${OpModule.USER}:${OpAction.USER.UPDATE}`, // "user_management:update_user_info"
    `${OpModule.USER}:${OpAction.USER.BAN}`, // "user_management:ban_user"

    //  2. 订单模块权限
    `${OpModule.ORDER}:${OpAction.ORDER.VIEW}`,
    `${OpModule.ORDER}:${OpAction.ORDER.EXPORT}`,

    //  3. 优惠券/营销权限
    `${OpModule.MARKETING}:${OpAction.MARKETING.VIEW}`, // ✅ 这样 ADMIN 就能调 findAll 了
    `${OpModule.MARKETING}:${OpAction.MARKETING.CREATE}`, // ✅ 这样 ADMIN 就能 create 了
    `${OpModule.MARKETING}:${OpAction.MARKETING.UPDATE}`,
  ],

  // ------------------------------------------
  // EDITOR (运营/编辑)
  // ------------------------------------------
  [Role.EDITOR]: [
    // 运营只能看用户，不能封号
    `${OpModule.USER}:${OpAction.USER.VIEW}`,

    // 运营管理所有营销活动
    `${OpModule.MARKETING}:${OpAction.MARKETING.VIEW}`,
    `${OpModule.MARKETING}:${OpAction.MARKETING.CREATE}`,
    `${OpModule.MARKETING}:${OpAction.MARKETING.UPDATE}`,
    // 注意：没给他 DELETE 权限，所以 Controller 上那个 Delete 接口他调不通
  ],

  // ------------------------------------------
  //  VIEWER (观察者)
  // ------------------------------------------
  [Role.VIEWER]: [
    // 只能看，啥都不能改
    `${OpModule.USER}:${OpAction.USER.VIEW}`,
    `${OpModule.ORDER}:${OpAction.ORDER.VIEW}`,
    `${OpModule.MARKETING}:${OpAction.MARKETING.VIEW}`,
  ],
} satisfies Partial<Record<Role | string, readonly string[]>>;
