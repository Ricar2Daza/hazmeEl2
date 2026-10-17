const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const test = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');
process.env.NODE_ENV = 'test';
const app = require('../../src/app').default;
const { initSocket } = require('../../src/utils/socket');
const { setMailTransportForTests } = require('../../src/utils/email');

const prisma = new PrismaClient();
const sentEmails = [];
let apiUrl;
let socketUrl;
let server;
let socketServer;

setMailTransportForTests({
  sendMail: async (email) => {
    sentEmails.push(email);
    return { messageId: `test-${sentEmails.length}` };
  },
});

test.before(async () => {
  server = createServer(app);
  socketServer = initSocket(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  apiUrl = `http://127.0.0.1:${address.port}/api`;
  socketUrl = `http://127.0.0.1:${address.port}`;
});

const apiRequest = async (path, { token, method = 'GET', body } = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
};

const login = async (email) => {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password: 'Test1234!' },
  });
  assert.equal(response.status, 200, `No se pudo iniciar sesión como ${email}`);
  return response.body;
};

const connectSocket = (token) => new Promise((resolve, reject) => {
  const socket = io(socketUrl, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
    reconnection: false,
    timeout: 5000,
  });
  socket.once('connect', () => resolve(socket));
  socket.once('connect_error', (error) => reject(error));
});

const waitForMessage = (socket, applicationId) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    socket.off('chat_message', handleMessage);
    reject(new Error('No se recibió el evento chat_message a tiempo'));
  }, 5000);
  const handleMessage = (message) => {
    if (message.applicationId !== applicationId) return;
    clearTimeout(timeout);
    socket.off('chat_message', handleMessage);
    resolve(message);
  };
  socket.on('chat_message', handleMessage);
});

test('REST persiste mensajes, protege participantes y emite por Socket.IO', { timeout: 30000 }, async () => {
  const publisher = await login('u1@test.com');
  const applicant = await login('u2@test.com');
  const outsider = await login('u3@test.com');
  const categories = await apiRequest('/categories');
  assert.equal(categories.status, 200);

  let jobId;
  let applicationId;
  let secondApplicationId;
  let publisherSocket;
  let applicantSocket;

  try {
    const jobTitle = `Chat integration ${Date.now()}`;
    const createdJob = await apiRequest('/jobs', {
      token: publisher.accessToken,
      method: 'POST',
      body: {
        title: jobTitle,
        description: 'Trabajo de prueba de integración para conversación directa entre participantes.',
        locationAddress: 'Madrid, España',
        budgetMin: 100,
        budgetMax: 200,
        deadlineDate: new Date(Date.now() + 86400000).toISOString(),
        categoryId: categories.body.data[0].id,
      },
    });
    assert.equal(createdJob.status, 201, JSON.stringify(createdJob.body));
    jobId = createdJob.body.data.id;

    const searchableJobs = await apiRequest(`/jobs?search=${encodeURIComponent(jobTitle)}`, { token: applicant.accessToken });
    assert.equal(searchableJobs.body.data.some((job) => job.id === jobId), true);
    const publisherSearch = await apiRequest(`/jobs?search=${encodeURIComponent(jobTitle)}`, { token: publisher.accessToken });
    assert.equal(publisherSearch.body.data.some((job) => job.id === jobId), false);

    const applied = await apiRequest(`/jobs/${jobId}/apply`, {
      token: applicant.accessToken,
      method: 'POST',
      body: { message: 'Preparado para conversar sobre el trabajo.' },
    });
    assert.equal(applied.status, 201, JSON.stringify(applied.body));
    applicationId = applied.body.data.id;
    const applicationEmail = sentEmails.at(-1);
    assert.equal(applicationEmail.to, publisher.user.email);
    assert.match(applicationEmail.subject, /Nueva postulación/);

    const secondApplied = await apiRequest(`/jobs/${jobId}/apply`, {
      token: outsider.accessToken,
      method: 'POST',
      body: { message: 'Segunda candidatura para verificar selección única.' },
    });
    assert.equal(secondApplied.status, 201);
    secondApplicationId = secondApplied.body.data.id;

    assert.equal((await apiRequest(`/chat/${applicationId}/messages`, { token: applicant.accessToken })).body.data.length, 0);
    assert.equal((await apiRequest(`/chat/${applicationId}/messages`, { token: outsider.accessToken })).status, 403);
    assert.equal((await apiRequest(`/chat/${applicationId}/messages`)).status, 401);
    assert.equal((await apiRequest(`/chat/${applicationId}/messages`, {
      token: outsider.accessToken,
      method: 'POST',
      body: { content: 'No soy participante.' },
    })).status, 403);
    assert.equal((await apiRequest(`/chat/${applicationId}/messages`, {
      token: applicant.accessToken,
      method: 'POST',
      body: { content: '   ' },
    })).status, 400);

    publisherSocket = await connectSocket(publisher.accessToken);
    applicantSocket = await connectSocket(applicant.accessToken);

    const firstContent = `Mensaje applicant ${Date.now()}`;
    const firstEvent = waitForMessage(publisherSocket, applicationId);
    const firstResponse = await apiRequest(`/chat/${applicationId}/messages`, {
      token: applicant.accessToken,
      method: 'POST',
      body: { content: `  ${firstContent}  ` },
    });
    assert.equal(firstResponse.status, 201);
    assert.equal(firstResponse.body.data.content, firstContent);
    assert.equal((await firstEvent).senderId, applicant.user.id);

    const replyContent = `Respuesta publisher ${Date.now()}`;
    const replyEvent = waitForMessage(applicantSocket, applicationId);
    const replyResponse = await apiRequest(`/chat/${applicationId}/messages`, {
      token: publisher.accessToken,
      method: 'POST',
      body: { content: replyContent },
    });
    assert.equal(replyResponse.status, 201);
    assert.equal((await replyEvent).senderId, publisher.user.id);

    const history = await apiRequest(`/chat/${applicationId}/messages`, { token: publisher.accessToken });
    assert.deepEqual(history.body.data.map((message) => message.content), [firstContent, replyContent]);
    const conversations = await apiRequest('/chat/conversations', { token: applicant.accessToken });
    assert.equal(conversations.body.data.some((item) => item.id === applicationId), true);

    const accepted = await apiRequest(`/applications/${applicationId}/accept`, {
      token: publisher.accessToken,
      method: 'PATCH',
    });
    assert.equal(accepted.status, 200);
    const acceptedEmail = sentEmails.at(-1);
    assert.equal(acceptedEmail.to, applicant.user.email);
    assert.match(acceptedEmail.subject, /Te eligieron/);
    assert.match(acceptedEmail.text, new RegExp(`/mensajes/${applicationId}`));
    const emailsAfterSelection = sentEmails.length;
    const secondAcceptance = await apiRequest(`/applications/${secondApplicationId}/accept`, {
      token: publisher.accessToken,
      method: 'PATCH',
    });
    assert.equal(secondAcceptance.status, 409);
    assert.equal(sentEmails.length, emailsAfterSelection);
  } finally {
    publisherSocket?.disconnect();
    applicantSocket?.disconnect();
    if (jobId) await prisma.job.deleteMany({ where: { id: jobId } });
  }
});

test.after(async () => {
  await new Promise((resolve) => socketServer.close(resolve));
  await prisma.$disconnect();
});