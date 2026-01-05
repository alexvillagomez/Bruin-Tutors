/**
 * Email utility for sending booking confirmation emails
 * Uses nodemailer with SMTP (Gmail or any SMTP server)
 */

import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@bruintutors.com'

  if (!smtpUser || !smtpPassword) {
    console.warn('⚠️ SMTP credentials not configured. Email not sent.')
    console.warn('Set SMTP_USER and SMTP_PASSWORD in .env.local to enable email sending')
    console.log('Would send email:', {
      to: options.to,
      subject: options.subject,
      from: smtpFrom,
    })
    return
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"Bruin Tutors" <${smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: options.html,
    })

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    })
  } catch (error: any) {
    console.error('❌ Failed to send email:', {
      error: error.message,
      to: options.to,
      subject: options.subject,
    })
    // Don't throw - email failures shouldn't break the booking
  }
}

export function generateBookingConfirmationEmail(data: {
  studentName: string
  tutorName: string
  startTime: Date
  endTime: Date
  sessionLength: number
  priceCents: number
  calendarEventId?: string | null
  calendarEventLink?: string | null
  zoomLink?: string | null
}): { subject: string; html: string; text: string } {
  const formattedDate = data.startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = data.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const price = (data.priceCents / 100).toFixed(2)

  const subject = `Booking Confirmed: ${data.tutorName} - ${formattedDate} at ${formattedTime}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #003B5C; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #003B5C; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.studentName},</p>
          <p>Your tutoring session has been confirmed. Here are the details:</p>
          
          <div class="details">
            <p><strong>Tutor:</strong> ${data.tutorName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${data.sessionLength} minutes</p>
            <p><strong>Amount Paid:</strong> $${price}</p>
          </div>
          
          ${data.calendarEventLink ? `
          <p style="margin: 20px 0;">
            <a href="${data.calendarEventLink}" class="button" style="display: inline-block; padding: 12px 24px; background-color: #003B5C; color: white; text-decoration: none; border-radius: 5px;">
              Add to Calendar
            </a>
          </p>
          <p>You should also receive a calendar invite via email. Please accept it to add the session to your calendar.</p>
          ` : ''}
          
          ${data.zoomLink ? `
          <div class="details" style="margin-top: 20px; background-color: #e8f4f8; border-left: 4px solid #003B5C;">
            <p style="margin: 0 0 10px 0;"><strong>Zoom Meeting Link:</strong></p>
            <p style="margin: 0;">
              <a href="${data.zoomLink}" style="color: #003B5C; text-decoration: underline; word-break: break-all;">${data.zoomLink}</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 0.9em; color: #666;">Click the link above to join your session at the scheduled time.</p>
          </div>
          ` : '<p>You will receive a Zoom link via email before your session.</p>'}
          
          <p>If you have any questions, please contact us.</p>
          
          <p>Best regards,<br>Bruin Tutors Team</p>
        </div>
        <div class="footer">
          <p>Bruin Tutors | UCLA Student Tutoring</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Booking Confirmed!

Hi ${data.studentName},

Your tutoring session has been confirmed. Here are the details:

Tutor: ${data.tutorName}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${data.sessionLength} minutes
Amount Paid: $${price}

${data.zoomLink ? `Zoom Meeting Link: ${data.zoomLink}\n\nClick the link above to join your session at the scheduled time.` : 'You will receive a Zoom link via email before your session.'}

If you have any questions, please contact us.

Best regards,
Bruin Tutors Team
  `.trim()

  return { subject, html, text }
}

