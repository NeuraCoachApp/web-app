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

    // Send welcome email
    const { data, error } = await resend.emails.send({
      from: 'Neura Coach <hello@neura.coach>',
      to: [email],
      subject: 'Welcome to Neura Coach! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Welcome to Neura Coach!</h1>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Hi ${displayName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Welcome to Neura Coach, we're so excited to have you with us! 🎉
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              In the next 48–72 hours, you'll receive a link to schedule your first session. We can't wait to get started and support you on your journey.
            </p>
            
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
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
