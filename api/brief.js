// Vercel serverless function — receives the brief modal submission
// and sends it as an email to kgermin@tuta.io via Resend.
//
// Setup:
//  1. Sign up at https://resend.com (free tier: 3k emails/month, 100/day)
//  2. Create an API key
//  3. In Vercel → your project → Settings → Environment Variables,
//     add: RESEND_API_KEY = re_...
//  4. Redeploy. Done.
//
// Sending from `onboarding@resend.dev` works on free tier without any
// domain verification. To send from `brief@yourdomain.com` later,
// verify the domain in Resend's dashboard and swap the `from` below.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[api/brief] RESEND_API_KEY missing");
    return res.status(500).json({ error: "Email service not configured" });
  }

  // Parse the body. On Vercel the body comes in pre-parsed when the
  // Content-Type is JSON; we defensively support both shapes.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot — bots tend to fill every visible field. Our real users
  // never see this one (display: none in CSS), so any value here is
  // almost certainly automated. Return a quiet 200 so the bot thinks
  // it succeeded; we just never send the email.
  if (body.website && String(body.website).trim()) {
    return res.status(200).json({ ok: true });
  }

  const description = String(body.description || "").trim();
  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  const contactValue = String(body.contactValue || "").trim();
  if (!contactValue) {
    return res.status(400).json({ error: "Contact is required" });
  }
  const contactMethod = String(body.contactMethod || "email").toLowerCase();
  const contactLabel = {
    email: "Email",
    x: "X",
    telegram: "Telegram",
  }[contactMethod] || "Contact";

  // Pull the visitor's IP + User-Agent out of the request so spammy /
  // abusive submitters can be blocked at the Vercel firewall level
  // later. Vercel sets `x-forwarded-for` (a comma-separated chain of
  // proxies, leftmost = original client) and `x-real-ip`. We prefer
  // the first hop of `x-forwarded-for` and fall back to `x-real-ip`.
  const xff = String(req.headers["x-forwarded-for"] || "");
  const clientIp =
    xff.split(",")[0].trim() ||
    String(req.headers["x-real-ip"] || "") ||
    "unknown";
  const userAgent = String(req.headers["user-agent"] || "unknown");
  const country = String(
    req.headers["x-vercel-ip-country"] ||
    req.headers["x-vercel-ip-country-region"] ||
    ""
  );

  // Build a clean, scannable email body.
  const lines = [];
  if (body.service) lines.push(`Service: ${body.service}`);
  if (body.answers && typeof body.answers === "object") {
    for (const [label, value] of Object.entries(body.answers)) {
      lines.push(`${label}: ${value || "—"}`);
    }
  }
  if (body.budget) lines.push(`Budget: ${body.budget}`);
  lines.push(`${contactLabel}: ${contactValue}`);
  if (body.lang) lines.push(`Language: ${body.lang}`);
  lines.push("");
  lines.push("Description:");
  lines.push(description);
  // Trace block at the bottom — kept separate from the brief content
  // so it doesn't muddle the read, but visible enough to copy/paste
  // an IP into Vercel's firewall when something feels off.
  lines.push("");
  lines.push("— trace —");
  lines.push(`IP: ${clientIp}`);
  if (country) lines.push(`Country: ${country}`);
  lines.push(`User-Agent: ${userAgent}`);

  const text = lines.join("\n");
  const html = text
    .split("\n")
    .map((l) => `<div>${escapeHtml(l) || "&nbsp;"}</div>`)
    .join("");

  const subject = `Kevin Germin brief — ${body.service || "general"}`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kevin Germin Brief <onboarding@resend.dev>",
        // On Resend's free tier the shared onboarding@resend.dev sender
        // can only deliver TO the email address that owns the Resend
        // account. Until a custom domain is verified, that's the
        // account's signup address.
        to: ["kirikev4d@gmail.com"],
        // Set Reply-To only when the visitor chose Email as their
        // contact method — X/Telegram handles aren't routable from
        // the inbox so leave Reply-To off in that case.
        reply_to: contactMethod === "email" && /@/.test(contactValue) ? contactValue : undefined,
        subject,
        text,
        html,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.error("[api/brief] Resend non-OK:", r.status, errText);
      // Surface the upstream message so the front-end can show it
      // to you during setup. Resend's errors are short and safe to
      // expose (e.g. "Domain is not verified", "Invalid `to` field").
      let upstream = errText;
      try { upstream = JSON.parse(errText)?.message || errText; } catch (_) {}
      return res.status(502).json({
        error: `Email service rejected the message`,
        upstream,
        status: r.status,
      });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[api/brief] send failed:", e);
    return res.status(500).json({ error: "Server error", detail: String(e && e.message ? e.message : e) });
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
