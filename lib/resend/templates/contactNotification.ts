// Admin notification email sent when a contact form is submitted.
// Inline styles are intentional — email clients strip external stylesheets.
// Matches the dark palette from the UStart magic link template.

interface ContactNotificationEmailProps {
  name: string;
  email: string;
  message: string;
  // Attached user ID when the sender is signed in; null for anonymous submissions.
  userId: string | null;
}

export function contactNotificationEmail({
  name,
  email,
  message,
  userId,
}: ContactNotificationEmailProps): string {
  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  // Escape HTML special characters so user-supplied content can't inject markup.
  const safe = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Form Submission — UStart</title>
</head>
<body style="background-color:#05080F;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#05080F;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;">UStart</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#0C1220;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 44px;">

              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;margin:0 0 28px;line-height:1.2;">New Contact Form Submission</h1>

              <!-- From -->
              <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">From</p>
              <p style="font-size:15px;color:#ffffff;margin:0 0 20px;">${safe(name)}</p>

              <!-- Email -->
              <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">Email</p>
              <p style="font-size:15px;color:#ffffff;margin:0 0 20px;">${safe(email)}</p>

              <!-- Message -->
              <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">Message</p>
              <p style="font-size:15px;color:rgba(255,255,255,0.85);line-height:1.65;margin:0 0 28px;white-space:pre-wrap;">${safe(message)}</p>

              <!-- Meta divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;">

                    <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">Account</p>
                    <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 16px;word-break:break-all;">
                      ${userId ? `Authenticated &mdash; ${safe(userId)}` : "Unauthenticated"}
                    </p>

                    <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">Received</p>
                    <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;">${timestamp} UTC</p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
