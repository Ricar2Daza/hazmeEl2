import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';

type MailTransport = Pick<Transporter, 'sendMail'>;

let testTransport: MailTransport | null = null;
let transporter: Transporter | null = null;
let missingConfigWarningLogged = false;

export const setMailTransportForTests = (transport: MailTransport | null): void => {
  testTransport = transport;
};

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character] as string));

const getTransporter = (): MailTransport | null => {
  if (testTransport) return testTransport;
  if (process.env.NODE_ENV === 'test') return null;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const isExampleConfig = host === 'smtp.example.com' || user === 'user@example.com' || password === 'password';
  if (!host || isExampleConfig) {
    if (!missingConfigWarningLogged) {
      console.warn('[Email] Configura SMTP_HOST, SMTP_USER y SMTP_PASS para habilitar correos.');
      missingConfigWarningLogged = true;
    }
    return null;
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || (process.env.SMTP_SECURE !== 'false' && port === 465),
      ...(user && password ? { auth: { user, pass: password } } : {}),
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
};

const sendEmail = async (message: SendMailOptions): Promise<void> => {
  const mailer = getTransporter();
  if (!mailer) return;

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      ...message,
    });
  } catch (error) {
    console.error('[Email] No se pudo enviar la notificación:', (error as Error).message);
  }
};

interface ApplicationEmailDetails {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  jobTitle: string;
  jobId: string;
  applicationId: string;
}

const createEmailLink = (path: string): string => {
  const baseUrl = (process.env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${baseUrl}${path}`;
};

export const sendNewApplicationEmail = async (details: ApplicationEmailDetails): Promise<void> => {
  const reviewUrl = createEmailLink(`/mis-publicaciones/${details.jobId}/postulantes`);
  await sendEmail({
    to: details.recipientEmail,
    subject: `Nueva postulación: ${details.jobTitle}`,
    text: `Hola ${details.recipientName}, ${details.senderName} se postuló a "${details.jobTitle}". Revisa y elige al profesional: ${reviewUrl}`,
    html: `<p>Hola ${escapeHtml(details.recipientName)},</p><p><strong>${escapeHtml(details.senderName)}</strong> se postuló a <strong>${escapeHtml(details.jobTitle)}</strong>.</p><p><a href="${escapeHtml(reviewUrl)}">Revisar postulantes y elegir profesional</a></p>`,
  });
};

export const sendApplicationAcceptedEmail = async (details: ApplicationEmailDetails): Promise<void> => {
  const chatUrl = createEmailLink(`/mensajes/${details.applicationId}`);
  await sendEmail({
    to: details.recipientEmail,
    subject: `Te eligieron para: ${details.jobTitle}`,
    text: `Hola ${details.recipientName}, ${details.senderName} te eligió para realizar "${details.jobTitle}". Contacta al publicante: ${chatUrl}`,
    html: `<p>Hola ${escapeHtml(details.recipientName)},</p><p><strong>${escapeHtml(details.senderName)}</strong> te eligió para realizar <strong>${escapeHtml(details.jobTitle)}</strong>.</p><p><a href="${escapeHtml(chatUrl)}">Abrir chat con el publicante</a></p>`,
  });
};