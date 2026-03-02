import { ImageResponse } from 'next/og';

export const alt = '집얼마 - 아파트 실거래가 · 전월세';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FONT_BASE =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr/files/noto-sans-kr';

export default async function OgImage() {
  const [krBold, latinBold, krRegular, latinRegular] = await Promise.all([
    fetch(`${FONT_BASE}-korean-700-normal.woff`).then((r) => r.arrayBuffer()),
    fetch(`${FONT_BASE}-latin-700-normal.woff`).then((r) => r.arrayBuffer()),
    fetch(`${FONT_BASE}-korean-400-normal.woff`).then((r) => r.arrayBuffer()),
    fetch(`${FONT_BASE}-latin-400-normal.woff`).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #134E4A 0%, #0F766E 40%, #14B8A6 100%)',
          fontFamily: 'NotoSansKR',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 300,
            height: 300,
            borderRadius: 150,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: 200,
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
          }}
        />

        {/* Building icon */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 72,
            height: 90,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 10,
            overflow: 'hidden',
            padding: '10px 8px 0',
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 20,
                height: 12,
                background: '#0D9488',
                borderRadius: 3,
              }}
            />
            <div
              style={{
                width: 20,
                height: 12,
                background: '#0D9488',
                borderRadius: 3,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 20,
                height: 12,
                background: '#0D9488',
                borderRadius: 3,
              }}
            />
            <div
              style={{
                width: 20,
                height: 12,
                background: '#0D9488',
                borderRadius: 3,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 20,
                height: 12,
                background: '#0D9488',
                borderRadius: 3,
              }}
            />
            <div
              style={{
                width: 20,
                height: 12,
                background: '#0D9488',
                borderRadius: 3,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            <div
              style={{
                width: 20,
                height: 16,
                background: '#0D9488',
                borderRadius: '3px 3px 0 0',
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1,
            marginBottom: 16,
            letterSpacing: -1,
          }}
        >
          집얼마
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1,
          }}
        >
          아파트 실거래가 · 전월세
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            display: 'flex',
            fontSize: 18,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          ulmazip.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'NotoSansKR',
          data: krBold,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'NotoSansKR',
          data: latinBold,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'NotoSansKR',
          data: krRegular,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'NotoSansKR',
          data: latinRegular,
          style: 'normal',
          weight: 400,
        },
      ],
    },
  );
}
