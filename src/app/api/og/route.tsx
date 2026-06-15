import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'Flowcore AI'
  const subtitle = searchParams.get('subtitle') || 'Automated Customer Service & AI Assistants'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0d0705 0%, #050505 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(198, 95, 57, 0.3) 0%, transparent 70%)',
          }}
        />
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 300,
            color: 'white',
            textAlign: 'center',
            letterSpacing: '-2px',
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: '#888888',
            textAlign: 'center',
            marginTop: '20px',
            zIndex: 1,
          }}
        >
          {subtitle}
        </p>
        <p
          style={{
            fontSize: '18px',
            fontWeight: 400,
            color: '#c65f39',
            textAlign: 'center',
            marginTop: '40px',
            zIndex: 1,
          }}
        >
          flowcore.ai
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
