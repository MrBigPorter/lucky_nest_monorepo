/**
 * Next.js App Router 约定：app/apple-icon.tsx 自动生成 apple-touch-icon
 * iOS Safari「添加到主屏幕」时使用此图标
 */
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background: 'linear-gradient(135deg, #dca449 0%, #ba6b20 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: 96,
        fontFamily: 'sans-serif',
        letterSpacing: '-2px',
      }}
    >
      J
    </div>,
    { ...size },
  );
}
