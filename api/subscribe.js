// /api/subscribe.js
import nodemailer from "nodemailer";
import { Pool } from "pg";
import 'dotenv/config';


// --- PostgreSQL connection ------------------------------------
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASS || "",
        database: process.env.DB_NAME || "propranker",
      }
);

// --------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const email = String(body.email || "").trim();
    const name = (body.name || "").toString().trim() || null;
    const source = (body.source || "").toString().slice(0, 500) || null;
    const ts = body.ts || new Date().toISOString();

    // consent might be missing for the bottom form
    const consentRaw = body.consent;
    const consent =
      typeof consentRaw === "boolean"
        ? consentRaw
        : consentRaw === "true" || consentRaw === "on"
        ? true
        : null;

    // --- Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // --- Save to PostgreSQL (do not fail the whole request if DB errors)
    try {
      await pool.query(
        `
        INSERT INTO newsletter_signups (email, name, consent, source)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET
          name    = COALESCE(EXCLUDED.name,    newsletter_signups.name),
          consent = COALESCE(EXCLUDED.consent, newsletter_signups.consent),
          source  = COALESCE(EXCLUDED.source,  newsletter_signups.source)
        `,
        [email, name, consent, source]
      );
    } catch (dbErr) {
      console.error("DB insert error:", dbErr);
      // we still continue to send the notification email
    }

    // --- Email notification to you (existing behaviour)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g. "smtp.ionos.co.uk"
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const who = name || "New subscriber";

    const text = [
      "New newsletter subscription:",
      "",
      `Name:   ${who}`,
      `Email:  ${email}`,
      "",
      `Consent: ${consent === null ? "n/a" : consent ? "yes" : "no"}`,
      `Source:  ${source || "unknown"}`,
      `Time:    ${ts}`,
    ].join("\n");

    await transporter.sendMail({
      from: `"Prop Ranker" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_TO || process.env.SMTP_USER,
      subject: "New newsletter subscriber",
      text,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
