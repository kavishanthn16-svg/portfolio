const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const jsonParser = express.json({ limit: '1mb' });

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const recentRequests = new Map();

app.use(express.static(__dirname));
app.use(jsonParser);

function sanitizeText(value) {
  return String(value ?? '').trim();
}

function getClientKey(req) {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function applyRateLimit(req, res, next) {
  const clientKey = getClientKey(req);
  const now = Date.now();
  const clientEntry = recentRequests.get(clientKey) || { timestamps: [] };

  clientEntry.timestamps = clientEntry.timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (clientEntry.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many messages sent. Please try again shortly.'
    });
  }

  clientEntry.timestamps.push(now);
  recentRequests.set(clientKey, clientEntry);
  next();
}

app.post('/api/contact', applyRateLimit, async (req, res) => {
  const name = sanitizeText(req.body.name);
  const email = sanitizeText(req.body.email);
  const message = sanitizeText(req.body.message);

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email is required.' });
  }

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required.' });
  }

  if (name.length > 100 || email.length > 254 || message.length > 2000) {
    return res.status(400).json({ success: false, message: 'Please keep your input within the allowed size.' });
  }

  const recipientEmail = process.env.PORTFOLIO_EMAIL;
  const senderEmail = process.env.SMTP_USER || process.env.PORTFOLIO_EMAIL;

  if (!recipientEmail || !process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('Missing email configuration.');
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'Portfolio Contact'} <${senderEmail}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `New Portfolio Message from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        'Message:',
        message
      ].join('\n')
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'Thanks! Your message has been sent successfully.'
    });
  } catch (error) {
    console.error('Contact email failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
