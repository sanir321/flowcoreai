'use server'

export async function sendAuthEmail({
  email,
  isNewUser,
  username,
}: {
  email: string
  isNewUser: boolean
  username: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/emails/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_CRON_SECRET}`,
    },
    body: JSON.stringify({
      to: email,
      subject: isNewUser ? 'Welcome to FlowCore!' : 'New Sign-in detected',
      template: isNewUser ? 'welcome' : 'signin',
      data: {
        username,
        loginUrl: `${baseUrl}/login`,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => 'unknown')
    console.warn('sendAuthEmail failed:', res.status, err)
  }
}
