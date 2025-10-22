// 先放一些占位类型，后面会加 DTO
export type Id = string;
export interface ApiError { code: string; message: string; details?: unknown }