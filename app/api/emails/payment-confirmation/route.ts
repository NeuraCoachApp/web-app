import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, firstName, lastName, planName, planPrice, nextBillingDate } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!planName) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
    }

    // Use provided name or construct from first/last name
    const displayName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || 'there');

    // Format the next billing date if provided
    const nextBillingText = nextBillingDate 
      ? `Your next billing date is ${new Date(nextBillingDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}.`
      : '';

    // Send payment confirmation email
    const { data, error } = await resend.emails.send({
      from: 'Neura Coach <hello@app.neura.coach>',
      to: [email],
      subject: 'Payment Confirmed - Welcome to Neura Coach! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Payment Confirmed!</h1>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #2563eb;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              Hi ${displayName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              🎉 <strong>Welcome to Neura Coach!</strong> Your payment has been successfully processed and you now have full access to your ${planName} plan.
            </p>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2563eb; margin: 0 0 10px 0;">Your Plan Details:</h3>
              <p style="margin: 5px 0; color: #334155;"><strong>Plan:</strong> ${planName}</p>
              ${planPrice ? `<p style="margin: 5px 0; color: #334155;"><strong>Price:</strong> ${planPrice}</p>` : ''}
              ${nextBillingText ? `<p style="margin: 5px 0; color: #334155;"><strong>Next Billing:</strong> ${nextBillingText}</p>` : ''}
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 15px;">
              You can now start your personalized coaching journey! Here's what you can do next:
            </p>
            
            <ul style="color: #334155; margin-bottom: 20px;">
              <li style="margin-bottom: 8px;">Set up your goals and preferences</li>
              <li style="margin-bottom: 8px;">Complete your first check-in session</li>
              <li style="margin-bottom: 8px;">Explore your personalized coaching dashboard</li>
            </ul>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://app.neura.coach/dashboard" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Go to Your Dashboard
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 0;">
              We're excited to support you on your journey to achieving your goals!<br><br>
              Best,<br>
              <strong>Neura Coach Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; margin: 0;">
              You're receiving this email because you've subscribed to Neura Coach.
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">
              Questions? Reply to this email or visit our support center.
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
    console.error('Payment confirmation email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
