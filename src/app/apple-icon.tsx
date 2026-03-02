import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
          borderRadius: 38,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 96,
            height: 120,
            background: 'white',
            borderRadius: 10,
            overflow: 'hidden',
            padding: '14px 12px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 16,
                background: '#0D9488',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                width: 28,
                height: 16,
                background: '#0D9488',
                borderRadius: 4,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 16,
                background: '#0D9488',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                width: 28,
                height: 16,
                background: '#0D9488',
                borderRadius: 4,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 16,
                background: '#0D9488',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                width: 28,
                height: 16,
                background: '#0D9488',
                borderRadius: 4,
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
                width: 30,
                height: 28,
                background: '#0D9488',
                borderRadius: '5px 5px 0 0',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
