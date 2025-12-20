export interface KycVerifyResult {
  success: boolean; // 请求是否成功
  passed: boolean; // 机器判定是否通过
  score: number; // 比对分数 (0-100)
  ocrData?: any; // 身份证读出的数据 (预留)
  rawResponse?: any; // 第三方返回的原始 JSON
  rejectReason?: string; // 拒绝原因
}
