import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'ヒッコシマップ - 東京の住環境リスクを可視化';

export default function OGImage() {
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 72, fontWeight: 800 }}>ヒッコシマップ</div>
      <div style={{ fontSize: 32, marginTop: 16, opacity: 0.9 }}>東京の住環境リスクを忖度なく可視化</div>
    </div>,
    { ...size }
  );
}
