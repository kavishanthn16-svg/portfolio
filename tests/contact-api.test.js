const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const nodemailer = require('nodemailer');

process.env.PORTFOLIO_EMAIL = 'owner@example.com';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_PORT = '465';
process.env.SMTP_USER = 'smtp-user@example.com';
process.env.SMTP_PASS = 'smtp-secret';

const app = require('../server.js');

test('rejects empty name', async () => {
  const response = await request(app)
    .post('/api/contact')
    .send({
      name: '',
      email: 'person@example.com',
      message: 'Hello there'
    });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /name/i);
});

test('rejects invalid email', async () => {
  const response = await request(app)
    .post('/api/contact')
    .send({
      name: 'Jane Doe',
      email: 'not-an-email',
      message: 'Hello there'
    });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /email/i);
});

test('accepts valid payload and sends email', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  nodemailer.createTransport = () => ({
    sendMail: async (mailOptions) => {
      assert.equal(mailOptions.to, 'owner@example.com');
      assert.equal(mailOptions.replyTo, 'jane@example.com');
      assert.match(mailOptions.subject, /New Portfolio Message from Jane Doe/);
      assert.match(mailOptions.text, /Name: Jane Doe/);
      return { messageId: '123' };
    }
  });

  try {
    const response = await request(app)
      .post('/api/contact')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'I would like to discuss a project.'
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.match(response.body.message, /sent successfully/i);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
  }
});
