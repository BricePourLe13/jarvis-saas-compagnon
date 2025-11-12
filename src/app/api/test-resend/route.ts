import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

/**
 * GET /api/test-resend
 * Test endpoint pour debug Resend
 */
export async function GET() {
  try {
    console.log('🔍 [TEST RESEND] Starting test...')
    
    // Vérifier env var
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY missing in env vars'
      }, { status: 500 })
    }

    console.log('✅ [TEST RESEND] API Key found:', apiKey.substring(0, 10) + '...')

    const resend = new Resend(apiKey)

    // Tester envoi simple
    const result = await resend.emails.send({
      from: 'JARVIS <no-reply@jarvis-group.net>', // Domaine principal vérifié ✅
      to: ['brice@jarvis-group.net'], // Email du compte Resend
      subject: '🔍 Test JARVIS - Resend Configuration',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; }
    .box { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #000; }
  </style>
</head>
<body>
  <h1>🔍 Test Resend Configuration</h1>
  <div class="box">
    <p><strong>From:</strong> JARVIS &lt;no-reply@send.jarvis-group.net&gt;</p>
    <p><strong>Date:</strong> ${new Date().toISOString()}</p>
    <p><strong>Status:</strong> ✅ Email envoyé avec succès</p>
  </div>
  <p>Si tu reçois cet email, Resend est bien configuré ! 🚀</p>
</body>
</html>
      `
    })

    console.log('✅ [TEST RESEND] Email sent successfully!')
    console.log('[TEST RESEND] Result:', JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      result
    })

  } catch (error: any) {
    console.error('❌ [TEST RESEND] Error:', error)
    console.error('[TEST RESEND] Error details:', JSON.stringify(error, null, 2))

    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: {
        name: error.name,
        statusCode: error.statusCode,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }
    }, { status: 500 })
  }
}

