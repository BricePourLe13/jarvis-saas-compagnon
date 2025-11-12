import { Resend } from 'resend';

const resend = new Resend('re_Y27ciKTY_3WPji4r37Yd6UChWDBYJwWwZ');

async function testResend() {
  try {
    console.log('🧪 Testing Resend API...');
    
    const { data, error } = await resend.emails.send({
      from: 'JARVIS <onboarding@resend.dev>',
      to: ['bricepradet7@gmail.com'],
      subject: 'Test Email - JARVIS',
      html: `
        <h1>Test Email</h1>
        <p>Si tu reçois cet email, Resend fonctionne ! ✅</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('🎯 Check your inbox at: brice.pradet@gmail.com');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testResend();

