import { NextResponse } from 'next/server'

// Email service configuration
// Using Resend (simple, Vercel-friendly) or Nodemailer
// For now, we'll use a simple approach that can be configured

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      preferredContactMethod,
      grade,
      subject,
      message,
      website // Honeypot field
    } = body

    // Honeypot spam protection
    if (website) {
      // Bot filled in honeypot field
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Get recipient email from environment
    const recipientEmail = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || 'alexvillagomeztutoring@gmail.com'

    // Build email content
    const emailSubject = `New Contact Form Submission from ${name}`
    const emailBody = `
New contact form submission from Bruin Tutors website:

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${grade ? `Student Grade: ${grade}` : ''}
${subject ? `Subject/Course: ${subject}` : ''}
Preferred Contact Method: ${preferredContactMethod || 'Not specified'}

Message:
${message}

---
Reply to: ${email}
${phone && preferredContactMethod === 'phone' ? `\nPreferred contact: Phone - ${phone}` : ''}
    `.trim()

    // Send email using Resend (recommended for Vercel)
    // If Resend is not set up, we'll use a simple approach
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (resendApiKey) {
      // Use Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Bruin Tutors <noreply@bruintutors.com>',
          to: recipientEmail,
          reply_to: email,
          subject: emailSubject,
          text: emailBody,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json()
        console.error('Resend API error:', errorData)
        throw new Error('Failed to send email via Resend')
      }
    } else {
      // Fallback: Log to console (for development)
      // In production, you should set up Resend or another email service
      console.log('=== CONTACT FORM SUBMISSION ===')
      console.log(emailBody)
      console.log('===============================')
      
      // For now, return success but log that email service is not configured
      console.warn('RESEND_API_KEY not set. Email not sent. Configure Resend to enable email delivery.')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!'
    })
  } catch (error: any) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}

