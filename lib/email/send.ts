import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend {
  if (client) return client;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY must be set");
  }

  client = new Resend(key);
  return client;
}

export async function sendTrendDigest(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: `${params.fromName} <${params.fromEmail}>`,
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    throw new Error(error.message);
  }
}
