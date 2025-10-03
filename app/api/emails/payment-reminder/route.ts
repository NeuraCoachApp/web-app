import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, firstName, lastName, daysSinceSignup } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use provided name or construct from first/last name
    const displayName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || 'there');

    // Calculate dynamic content based on days since signup
    const timeContext = daysSinceSignup > 7 ? 'week' : 'few days';
    const urgencyText = daysSinceSignup > 14 
      ? 'Don\'t let your goals wait any longer!' 
      : 'Ready to take the next step?';

    // Send payment reminder email
    const { data, error } = await resend.emails.send({
      from: 'Neura Coach <hello@app.neura.coach>',
      to: [email],
      subject: 'Unlock Your Full Coaching Potential 🔓',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Unlock Your Full Potential</h1>
          </div>
          
          <div style="background-color: #fef9f3; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Hi ${displayName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              It's been a ${timeContext} since you signed up for Neura Coach, and we wanted to check in! 
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              <strong>${urgencyText}</strong> Upgrading to one of our coaching plans will unlock:
            </p>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <ul style="color: #334155; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 12px;"><strong>AI-Powered Goal Setting:</strong> Personalized goal creation based on your unique situation</li>
                <li style="margin-bottom: 12px;"><strong>Daily Check-ins:</strong> Stay accountable with guided progress tracking</li>
                <li style="margin-bottom: 12px;"><strong>Smart Insights:</strong> Advanced analytics to understand your patterns and optimize your approach</li>
                <li style="margin-bottom: 12px;"><strong>Adaptive Coaching:</strong> Your plan evolves with you as you make progress</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Our users typically see meaningful progress within their first month. Don't let another day pass without the support you deserve!
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://app.neura.coach/pricing" 
                 style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Choose Your Plan
              </a>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://app.neura.coach/dashboard" 
                 style="color: #2563eb; text-decoration: none; font-size: 14px;">
                Or continue with your free account →
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 0;">
              Questions about our plans? Just reply to this email - we're here to help!<br><br>
              Best,<br>
              <strong>Neura Coach Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; margin: 0;">
              You're receiving this email because you have a Neura Coach account.
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">
              Don't want these reminders? <a href="#" style="color: #64748b;">Unsubscribe here</a>
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
    console.error('Payment reminder email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
