import { SetMetadata } from '@nestjs/common';
export const SKIP_WRAP = 'SKIP_WRAP';
export const SkipWrap = () => SetMetadata(SKIP_WRAP, true);
