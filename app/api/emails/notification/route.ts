import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, firstName, lastName, sessionTime, sessionLink } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!sessionTime) {
      return NextResponse.json({ error: 'Session time is required' }, { status: 400 });
    }

    // Use provided name or construct from first/last name
    const displayName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || 'there');

    // Send notification email
    const { data, error } = await resend.emails.send({
      from: 'Neura Coach <hyejeebae@gmail.com>',
      to: [email],
      subject: 'Your Neura Coach Session Starts Soon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Session Reminder</h1>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Hi ${displayName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Your Neura Coach session starts soon. You can join by clicking the link below.
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${sessionLink || '#'}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Join Your Session
              </a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 15px;">
              <strong>Session Time:</strong> ${sessionTime}
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 0;">
              Best,<br>
              <strong>Neura Coach Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; margin: 0;">
              You're receiving this email because you have an upcoming Neura Coach session.
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
    console.error('Notification email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
