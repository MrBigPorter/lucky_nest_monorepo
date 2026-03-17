/**
 * Next.js App Router 约定：app/icon.tsx 自动生成 /icon favicon
 * 无需手动在 metadata 中配置，Next.js 会自动注入 <link rel="icon">
 */
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #dca449 0%, #ba6b20 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: 18,
        fontFamily: 'sans-serif',
        letterSpacing: '-0.5px',
      }}
    >
      J
    </div>,
    { ...size },
  );
}
