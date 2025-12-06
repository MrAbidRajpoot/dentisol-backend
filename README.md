# Dentisol Backend API

Express.js backend server for handling contact form submissions using Resend email service.

## Features

- ✅ Contact form email handling
- ✅ HTML email templates
- ✅ Input validation
- ✅ Error handling
- ✅ CORS support
- ✅ Environment variable configuration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Resend account (free tier: 100 emails/day)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Resend API Key

1. Sign up at [Resend.com](https://resend.com) (free account)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Resend API key:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   RECIPIENT_EMAIL=info.dentisol@gmail.com
   FROM_EMAIL=info.dentisol@gmail.com
   FROM_NAME=Dentisol Contact Form
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```

### 4. Verify Email Domain (Important!)

**For production use**, you need to verify your email domain in Resend:

1. Go to [Resend Domains](https://resend.com/domains)
2. Add your domain (e.g., `dentisol.com`)
3. Add the DNS records provided by Resend to your domain's DNS settings
4. Wait for verification (usually takes a few minutes)

**For development/testing**, you can use Resend's test email addresses or verify a single email address.

### 5. Run the Server

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

- **From Address**: Set in `FROM_EMAIL` (must be verified in Resend)
- **Reply-To**: Automatically set to the user's email address
- **Recipient**: Set in `RECIPIENT_EMAIL` (where contact form submissions are sent)

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

### "Invalid API Key" Error
- Verify your `RESEND_API_KEY` is correct in `.env`
- Make sure there are no extra spaces or quotes

### "Domain not verified" Error
- Verify your email domain in Resend dashboard
- For testing, use Resend's test email addresses

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Make sure the backend allows requests from your frontend domain

### Email Not Sending
- Check Resend dashboard for error logs
- Verify your API key has the correct permissions
- Check that your domain/email is verified in Resend

## License

ISC
