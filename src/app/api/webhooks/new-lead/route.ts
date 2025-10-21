import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Log pour debugging
    console.log('🎯 WEBHOOK CALLED - Method:', req.method);
    console.log('🎯 WEBHOOK CALLED - Headers:', Object.fromEntries(req.headers.entries()));
    
    // Supabase webhook envoie { type: 'INSERT', table: 'contact_leads', record: {...}, old_record: null }
    const body = await req.json();
    console.log('🎯 WEBHOOK BODY:', JSON.stringify(body, null, 2));
    
    const { record } = body;
    
    if (!record) {
      console.error('❌ No record in webhook body');
      return NextResponse.json({ error: 'No record provided' }, { status: 400 });
    }
    
    console.log('📧 Nouveau lead reçu:', record.full_name, record.email);
    console.log('🔑 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    
    // Envoyer email de notification à toi
    const emailResult = await resend.emails.send({
      from: 'JARVIS Notifications <notifications@jarvis-group.net>',
      to: 'brice.pradet@gmail.com', // TON EMAIL
      subject: `🚀 Nouveau lead ${record.lead_type} : ${record.full_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
            .field-value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #667eea; }
            .cta { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚀 Nouveau Lead ${record.lead_type === 'pilot' ? 'Pilote' : 'Contact'}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Reçu le ${new Date(record.created_at).toLocaleString('fr-FR')}</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">👤 Nom complet</div>
                <div class="field-value">${record.full_name}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📧 Email</div>
                <div class="field-value"><a href="mailto:${record.email}">${record.email}</a></div>
              </div>
              
              ${record.company_name ? `
              <div class="field">
                <div class="field-label">🏢 Salle de sport</div>
                <div class="field-value">${record.company_name}</div>
              </div>
              ` : ''}
              
              ${record.phone ? `
              <div class="field">
                <div class="field-label">📞 Téléphone</div>
                <div class="field-value"><a href="tel:${record.phone}">${record.phone}</a></div>
              </div>
              ` : ''}
              
              ${record.message ? `
              <div class="field">
                <div class="field-label">💬 Message</div>
                <div class="field-value">${record.message}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="field-label">🔍 Statut</div>
                <div class="field-value">${record.status || 'new'}</div>
              </div>
              
              <a href="https://supabase.com/dashboard/project/vurnokaxnvittopqteno/editor/28539?sort=created_at%3Adesc" class="cta">
                Voir dans Supabase →
              </a>
            </div>
            <div class="footer">
              <p>Email envoyé automatiquement par JARVIS via webhook Supabase</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('✅ Email envoyé:', emailResult);
    
    return NextResponse.json({ 
      success: true, 
      emailId: emailResult.data?.id 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur webhook:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
}

// Route publique (Supabase webhook)
// Note: Using Node.js runtime instead of Edge for better Resend compatibility
export const runtime = 'nodejs';
