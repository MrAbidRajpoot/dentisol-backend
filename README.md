# Dentisol Backend API

Express.js backend server for handling contact form submissions using Nodemailer with Brevo SMTP.

## Features

- ✅ Contact form email handling via Brevo SMTP
- ✅ HTML email templates
- ✅ Input validation
- ✅ Error handling
- ✅ CORS support
- ✅ Environment variable configuration
- ✅ Email headers for better deliverability
- ✅ Works with serverless deployments (Vercel, etc.)
- ✅ Free tier: 300 emails/day

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Brevo account (free tier available)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Brevo Account

1. Sign up for a free Brevo account at [brevo.com](https://www.brevo.com)
   - Free tier: 300 emails/day
2. Go to **Settings** → **SMTP & API** → **SMTP**
3. Copy your **SMTP Login** (your Brevo account email)
4. Generate or copy your **SMTP Key** (if you don't have one, click "Generate")
5. **Important**: Verify your sender email address in Brevo
   - Go to **Settings** → **Senders & IP**
   - Add and verify `info.dentisol@gmail.com` (or your FROM_EMAIL)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Brevo SMTP credentials:
   ```
   BREVO_SMTP_USER=your_brevo_email@example.com
   BREVO_SMTP_KEY=your_brevo_smtp_key_here
   RECIPIENT_EMAIL=info.dentisol@gmail.com
   FROM_EMAIL=info.dentisol@gmail.com
   FROM_NAME=Dentisol Contact Form
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```

3. **For Vercel deployment**, add these same variables in:
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Make sure to add them for Production, Preview, and Development environments

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

- **From Address**: Set in `FROM_EMAIL` (must be verified in Brevo)
- **Reply-To**: Automatically set to the user's email address
- **Recipient**: Set in `RECIPIENT_EMAIL` (where contact form submissions are sent)
- **Subject**: "Contact Form: [name] wants to reach you"
- **Headers**: Includes X-Priority and X-Entity-Ref-ID for better deliverability
- **SMTP**: Brevo SMTP (smtp-relay.brevo.com:587)

## Why Brevo SMTP?

- ✅ Simple SMTP setup (no OAuth2 complexity)
- ✅ Works reliably in serverless environments (Vercel, AWS Lambda, etc.)
- ✅ Free tier: 300 emails/day
- ✅ Easy to use and configure
- ✅ Good deliverability rates
- ✅ No IP restrictions
- ✅ Professional email service

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
- Verify your `BREVO_SMTP_USER` is your Brevo account email
- Check that `BREVO_SMTP_KEY` is correct (SMTP key, not API key)
- Ensure there are no extra spaces or quotes in the `.env` file
- Regenerate your SMTP key in Brevo dashboard if needed

### "Sender not verified" Error
- Make sure your `FROM_EMAIL` is verified in Brevo
- Go to Brevo Dashboard → Settings → Senders & IP
- Add and verify your sender email address
- Wait for verification to complete (usually instant)

### Email Not Sending
- Check server console for error messages
- Verify Brevo SMTP credentials are correct
- Test the endpoint with a simple curl request
- Check Brevo dashboard for any account issues
- Verify you haven't exceeded the daily email limit (300/day on free tier)

### CORS Errors

**For Vercel Deployments:**
- The backend automatically allows all Vercel URLs (`.vercel.app` domains)
- No additional configuration needed for Vercel preview/production URLs
- If using a custom domain, add it to `FRONTEND_URL` environment variable

**For Other Deployments:**
- Update `FRONTEND_URL` in `.env` to match your frontend URL
- For multiple frontend URLs, use `FRONTEND_URLS` (comma-separated): 
  ```
  FRONTEND_URLS=https://example.com,https://www.example.com,https://staging.example.com
  ```
- Make sure the backend allows requests from your frontend domain

**Common CORS Issues:**
- Check browser console for the exact origin being blocked
- Verify the origin matches what's in your environment variables
- Ensure `FRONTEND_URL` includes the protocol (`https://` not just the domain)
- For Vercel, the backend automatically allows all `.vercel.app` domains

### Vercel Deployment Issues
- Ensure all environment variables are set in Vercel dashboard
- Redeploy after adding environment variables
- Check Vercel function logs for detailed error messages
- Verify Brevo SMTP credentials are correct
- **CORS is automatically configured for Vercel** - all `.vercel.app` domains are allowed
- If using a custom domain, add it to `FRONTEND_URL` environment variable in Vercel

### Connection Timeout
- Check your firewall settings
- Ensure port 587 (SMTP) is not blocked
- Brevo SMTP should work from any IP address
- Try using port 465 with `secure: true` if 587 doesn't work (update server.js)

## License

ISC
