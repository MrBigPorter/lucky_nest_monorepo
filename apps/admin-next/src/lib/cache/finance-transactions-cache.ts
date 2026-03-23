// Finance transactions cache/query contract helpers.
export interface TransactionsQueryInput {
  page: number;
  pageSize: number;
  keyword?: string;
  transactionType?: number;
  startDate?: string;
  endDate?: string;
}

export type NextSearchParams = Record<string, string | string[] | undefined>;

function readParam(params: NextSearchParams, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function parseTransactionsSearchParams(
  params: NextSearchParams,
): TransactionsQueryInput {
  const page = parsePositiveInt(readParam(params, 'page'), 1);
  const pageSize = parsePositiveInt(readParam(params, 'pageSize'), 10);
  const keyword = readParam(params, 'keyword')?.trim();
  const transactionTypeRaw = readParam(params, 'transactionType');
  const transactionType =
    transactionTypeRaw && transactionTypeRaw !== 'ALL'
      ? parsePositiveInt(transactionTypeRaw, 0)
      : undefined;
  const startDate = readParam(params, 'startDate');
  const endDate = readParam(params, 'endDate');

  return {
    page,
    pageSize,
    ...(keyword ? { keyword } : {}),
    ...(transactionType ? { transactionType } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
}
