import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html } = req.body;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured. Email not sent.");
    return res.status(200).json({ status: "skipped", message: "SMTP not configured" });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent successfully:", info.messageId);
    res.json({ status: "ok", messageId: info.messageId });
  } catch (error: any) {
    console.error("Email sending failed:", error);
    
    const errorMessage = error.message || String(error);
    
    if (errorMessage.includes("550") || errorMessage.includes("Mailbox does not exist") || errorMessage.includes("rejected")) {
      return res.status(400).json({ 
        status: "error", 
        error: "The recipient email address appears to be invalid or non-existent.",
        details: errorMessage
      });
    }

    res.status(500).json({ status: "error", error: errorMessage });
  }
}
