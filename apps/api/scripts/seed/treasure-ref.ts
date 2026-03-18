import { PrismaClient } from '@prisma/client';

export type TreasureRefInput =
  | string
  | {
      seq?: string;
      treasureSeq?: string;
      id?: string;
      treasureId?: string;
      name?: string;
      treasureName?: string;
      keyword?: string;
      title?: string;
      jumpUrl?: string;
      url?: string;
    };

type TreasureLite = {
  treasureId: string;
  treasureSeq: string | null;
  treasureName: string;
};

const SEQ_REGEX = /JM-\d{3}/i;
const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function extractSeqFromText(text: string): string | null {
  const match = text.match(SEQ_REGEX);
  return match?.[0]?.toUpperCase() ?? null;
}

function toCandidateStrings(ref: TreasureRefInput): string[] {
  if (typeof ref === 'string') {
    return [ref];
  }

  const values = [
    ref.seq,
    ref.treasureSeq,
    ref.id,
    ref.treasureId,
    ref.name,
    ref.treasureName,
    ref.keyword,
    ref.title,
    ref.jumpUrl,
    ref.url,
  ];

  return values.filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  );
}

function parseCandidate(ref: TreasureRefInput): {
  seq?: string;
  treasureId?: string;
  keyword?: string;
} {
  const candidates = toCandidateStrings(ref);

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    const upper = trimmed.toUpperCase();

    if (SEQ_REGEX.test(upper)) {
      const seq = extractSeqFromText(upper);
      if (seq) return { seq };
    }

    if (CUID_REGEX.test(trimmed)) {
      return { treasureId: trimmed };
    }
  }

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return { keyword: trimmed };
    }
  }

  return {};
}

export function createTreasureResolver(db: PrismaClient) {
  let cached: TreasureLite[] | null = null;
  const byId = new Map<string, TreasureLite>();
  const bySeq = new Map<string, TreasureLite>();

  async function ensureLoaded() {
    if (cached) return;

    cached = await db.treasure.findMany({
      select: {
        treasureId: true,
        treasureSeq: true,
        treasureName: true,
      },
    });

    for (const row of cached) {
      byId.set(row.treasureId, row);
      if (row.treasureSeq) {
        bySeq.set(row.treasureSeq.toUpperCase(), row);
      }
    }
  }

  return {
    async resolve(ref: TreasureRefInput): Promise<TreasureLite | null> {
      await ensureLoaded();

      const parsed = parseCandidate(ref);

      if (parsed.treasureId) {
        return byId.get(parsed.treasureId) ?? null;
      }

      if (parsed.seq) {
        return bySeq.get(parsed.seq.toUpperCase()) ?? null;
      }

      if (!parsed.keyword || !cached) {
        return null;
      }

      const keyword = normalize(parsed.keyword);

      const exact = cached.find(
        (row) => normalize(row.treasureName) === keyword,
      );
      if (exact) return exact;

      return (
        cached.find((row) => normalize(row.treasureName).includes(keyword)) ??
        null
      );
    },
  };
}
