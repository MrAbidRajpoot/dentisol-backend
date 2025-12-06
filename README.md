# Dentisol Backend API

Express.js backend server for handling contact form submissions using Nodemailer with Gmail SMTP.

## Features

- ✅ Contact form email handling via Gmail SMTP
- ✅ HTML email templates
- ✅ Input validation
- ✅ Error handling
- ✅ CORS support
- ✅ Environment variable configuration
- ✅ Email headers for better deliverability

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gmail account with 2-Step Verification enabled

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Gmail App Password

**Important:** You cannot use your regular Gmail password. You need to generate an App Password.

1. Go to your [Google Account](https://myaccount.google.com)
2. Click on **Security** in the left sidebar
3. Under **"Signing in to Google"**, enable **"2-Step Verification"** if not already enabled
4. After enabling 2-Step Verification, go back to **Security**
5. Under **"Signing in to Google"**, click on **"App passwords"**
6. Select **"Mail"** as the app and **"Other (Custom name)"** as the device
7. Enter **"Dentisol Backend"** as the custom name
8. Click **"Generate"**
9. Copy the 16-character password (spaces don't matter - you can include or remove them)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Gmail credentials:
   ```
   EMAIL_USER=info.dentisol@gmail.com
   EMAIL_PASS=your_16_character_app_password_here
   RECIPIENT_EMAIL=info.dentisol@gmail.com
   FROM_NAME=Dentisol Contact Form
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in `.env`).

## API Endpoints

### POST `/api/contact`

Send a contact form submission via email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",  // optional
  "message": "Hello, I'm interested in your services."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your message has been sent successfully! We will get back to you soon.",
  "emailId": "email_id_from_resend"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Frontend Integration

Update your React contact form to send POST requests to the backend:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert(data.message);
      // Reset form
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

**For production**, update the API URL to your deployed backend URL.

## Email Configuration

- **From Address**: Set in `EMAIL_USER` (your Gmail address)
- **Reply-To**: Automatically set to the user's email address
- **Recipient**: Set in `RECIPIENT_EMAIL` (where contact form submissions are sent)
- **Subject**: "Contact Form: [name] wants to reach you"
- **Headers**: Includes X-Priority and X-Entity-Ref-ID for better deliverability

## Deployment

### Environment Variables for Production

Make sure to set these environment variables in your hosting platform:

- `RESEND_API_KEY`
- `RECIPIENT_EMAIL`
- `FROM_EMAIL`
- `FROM_NAME`
- `FRONTEND_URL` (your production frontend URL)
- `PORT` (optional)

### Popular Hosting Options

- **Vercel**: Easy deployment with automatic environment variable support
- **Heroku**: Traditional hosting with environment variables
- **Railway**: Simple deployment with built-in environment variable management
- **DigitalOcean App Platform**: Simple deployment
- **AWS/Google Cloud**: More control, requires more setup

## Troubleshooting

### "Invalid login" or Authentication Error
- Make sure you're using a **Gmail App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled on your Google Account
- Check that `EMAIL_USER` and `EMAIL_PASS` are correct in `.env`
- Ensure there are no extra spaces or quotes in the `.env` file

### "Less secure app access" Error
- Gmail no longer supports "less secure apps"
- You **must** use an App Password (see Setup Instructions above)
- Regular passwords will not work

### Email Not Sending
- Check server console for error messages
- Verify Nodemailer connection on server startup (should see "Nodemailer is ready to send emails")
- Test your App Password by trying to send a test email
- Check Gmail account for any security alerts

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Make sure the backend allows requests from your frontend domain

### Connection Timeout
- Check your firewall settings
- Ensure port 587 (SMTP) is not blocked
- Try using port 465 with `secure: true` if 587 doesn't work

## License

ISC
