import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 18,
            height: 22,
            background: 'white',
            borderRadius: 2,
            overflow: 'hidden',
            padding: '3px 2px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 5,
                height: 3,
                background: '#0D9488',
                borderRadius: 1,
              }}
            />
            <div
              style={{
                width: 5,
                height: 3,
                background: '#0D9488',
                borderRadius: 1,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 5,
                height: 3,
                background: '#0D9488',
                borderRadius: 1,
              }}
            />
            <div
              style={{
                width: 5,
                height: 3,
                background: '#0D9488',
                borderRadius: 1,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 5,
                height: 3,
                background: '#0D9488',
                borderRadius: 1,
              }}
            />
            <div
              style={{
                width: 5,
                height: 3,
                background: '#0D9488',
                borderRadius: 1,
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
                width: 5,
                height: 5,
                background: '#0D9488',
                borderRadius: '1px 1px 0 0',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
