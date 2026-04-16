// Parent invitation email — matches the UStart magic link email template exactly:
// same dark background, card layout, CTA button, and footer style.
// Inline styles are intentional — email clients strip external stylesheets.

interface ParentInvitationEmailProps {
  // Student's display name shown in the invitation body.
  studentName: string;
  // The generated magic link URL the parent clicks to accept the invitation.
  inviteUrl: string;
}

export function parentInvitationEmail({
  studentName,
  inviteUrl,
}: ParentInvitationEmailProps): string {
  // Minimal escaping for values we control (studentName comes from DB, inviteUrl from Supabase).
  const safe = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>You've been invited to UStart</title>
  <style>
    * { margin:0;padding:0;box-sizing:border-box; }
    body { background-color:#0A0F1E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#ffffff; }
    table { border-collapse:collapse; }
    img { border:0;display:block; }
    a { text-decoration:none; }
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color:#0A0F1E !important; }
    }
  </style>
</head>
<body style="background-color:#0A0F1E;margin:0;padding:0;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0A0F1E;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;">UStart</span>
            </td>
          </tr>

          <!-- Card body -->
          <tr>
            <td style="background-color:#0C1220;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px 44px;">

              <!-- Heading -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;margin:0;line-height:1.2;">You've been invited to UStart</h1>
                  </td>
                </tr>
              </table>

              <!-- Subtext -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <p style="font-size:15px;line-height:1.65;color:rgba(255,255,255,0.5);margin:0;max-width:360px;">
                      <strong style="color:rgba(255,255,255,0.75);">${safe(studentName)}</strong> has invited you to create a parent account linked to their UStart membership. Accept the invitation to access your parent portal.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <a href="${safe(inviteUrl)}" style="display:inline-block;background-color:#ffffff;color:#05080F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:-0.01em;padding:14px 36px;border-radius:8px;text-decoration:none;cursor:pointer;">Accept invitation &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:28px;padding-bottom:4px;">
                    <p style="font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6;margin:0;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="font-size:11px;color:rgba(255,255,255,0.2);word-break:break-all;margin-top:6px;line-height:1.5;">${safe(inviteUrl)}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="font-size:12px;color:rgba(255,255,255,0.2);line-height:1.7;margin:0;">
                You're receiving this because you were invited to join UStart as a parent.<br>
                If you weren't expecting this, you can safely ignore this email.<br><br>
                &copy; 2026 UStart &nbsp;&middot;&nbsp;
                <a href="#" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="#" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Terms</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
