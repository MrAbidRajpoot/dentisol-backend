const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Nodemailer with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER, // Your Brevo account email
    pass: process.env.BREVO_SMTP_KEY,  // Brevo SMTP API key
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Brevo SMTP configuration error:', error);
  } else {
    console.log('Brevo SMTP is ready to send emails');
  }
});

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Name, email, and message are required.'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.'
      });
    }

    // Prepare email content
    const subject = `Contact Form: ${name} wants to reach you`;
    const recipientEmail = process.env.RECIPIENT_EMAIL || 'info.dentisol@gmail.com';
    const fromEmail = process.env.FROM_EMAIL || 'info.dentisol@gmail.com';
    const fromName = process.env.FROM_NAME || 'Dentisol Contact Form';
    
    // Generate unique identifier for email tracking
    const emailRefId = uuidv4();

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #00A8A8, #2C3E50);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .field {
              margin-bottom: 20px;
              padding: 15px;
              background: white;
              border-radius: 5px;
              border-left: 4px solid #00A8A8;
            }
            .field-label {
              font-weight: bold;
              color: #2C3E50;
              margin-bottom: 5px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .field-value {
              color: #333;
              font-size: 16px;
            }
            .message-box {
              background: white;
              padding: 20px;
              border-radius: 5px;
              border-left: 4px solid #00A8A8;
              margin-top: 10px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Name</div>
              <div class="field-value">${name}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value">
                <a href="mailto:${email}" style="color: #00A8A8; text-decoration: none;">${email}</a>
              </div>
            </div>
            
            ${phone ? `
            <div class="field">
              <div class="field-label">Phone</div>
              <div class="field-value">${phone}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="field-label">Message</div>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="footer">
              <p>This email was sent from the Dentisol contact form.</p>
              <p>Reply to this email to respond directly to ${name}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Message:
${message}

---
This email was sent from the Dentisol contact form.
Reply to this email to respond directly to ${name}.
    `;

    // Prepare email options
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      replyTo: email, // User's email as reply-to
      subject: subject,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Priority': '1',
        'X-Entity-Ref-ID': emailRefId,
        'X-Mailer': 'Dentisol Contact Form',
      },
    };

    // Send email using Nodemailer with Brevo SMTP
    try {
      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', {
        messageId: info.messageId,
        response: info.response,
        refId: emailRefId
      });

      // Success response
      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully! We will get back to you soon.',
        emailId: info.messageId,
        refId: emailRefId
      });
    } catch (emailError) {
      console.error('Nodemailer Error:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

