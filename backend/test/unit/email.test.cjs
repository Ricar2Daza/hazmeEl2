const assert = require('node:assert/strict');
const test = require('node:test');
process.env.NODE_ENV = 'test';
const {
  sendApplicationAcceptedEmail,
  sendNewApplicationEmail,
  setMailTransportForTests,
} = require('../../src/utils/email');

const sentEmails = [];
const details = {
  recipientEmail: 'recipient@example.com',
  recipientName: '<Contact>',
  senderName: 'Publicante & Co',
  jobTitle: '<Trabajo>',
  jobId: 'job-id',
  applicationId: 'application-id',
};

test.beforeEach(() => {
  sentEmails.length = 0;
  setMailTransportForTests({
    sendMail: async (message) => {
      sentEmails.push(message);
      return { messageId: 'unit-test' };
    },
  });
});

test.after(() => setMailTransportForTests(null));

test('notifica al publicante de una nueva postulación con HTML escapado', async () => {
  await sendNewApplicationEmail(details);

  assert.equal(sentEmails[0].to, details.recipientEmail);
  assert.match(sentEmails[0].subject, /Nueva postulación/);
  assert.match(sentEmails[0].text, /job-id\/postulantes/);
  assert.match(sentEmails[0].html, /&lt;Trabajo&gt;/);
  assert.doesNotMatch(sentEmails[0].html, /<Trabajo>/);
});

test('notifica al postulante elegido e incluye acceso al chat', async () => {
  await sendApplicationAcceptedEmail(details);

  assert.equal(sentEmails[0].to, details.recipientEmail);
  assert.match(sentEmails[0].subject, /Te eligieron/);
  assert.match(sentEmails[0].text, /mensajes\/application-id/);
});