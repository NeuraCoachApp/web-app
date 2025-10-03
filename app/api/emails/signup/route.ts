import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, firstName, lastName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use provided name or construct from first/last name
    const displayName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || 'there');

    // Send signup email
    const { data, error } = await resend.emails.send({
      from: 'Neura Coach <hello@app.neura.coach>',
      to: [email],
      subject: 'Thanks for signing up! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Thanks for Signing Up!</h1>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Hi ${displayName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Thanks for creating your Neura Coach account! 🚀
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              You're now ready to start your personalized coaching journey. To get the most out of Neura Coach, consider upgrading to one of our coaching plans for full access to all features.
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://app.neura.coach/pricing" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                View Pricing Plans
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 0;">
              Best,<br>
              <strong>Neura Coach Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; margin: 0;">
              You're receiving this email because you signed up for Neura Coach.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error('Signup email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
