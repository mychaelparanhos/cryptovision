import { Resend } from "resend";

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export interface WeeklyHighlight {
  type: "liquidation" | "funding" | "oi_change";
  symbol: string;
  exchange: string;
  value: number;
  description: string;
  timestamp: string;
}

/**
 * Render the weekly digest email HTML.
 */
export function renderWeeklyDigestEmail(
  highlights: WeeklyHighlight[],
  recipientEmail: string
): string {
  const highlightRows = highlights
    .map(
      (h) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #27272A;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #71717A; text-transform: uppercase;">${h.type.replace("_", " ")}</span>
        </div>
        <div style="font-size: 14px; color: #FAFAFA; font-weight: 600; margin-top: 4px;">
          ${h.symbol} — ${h.exchange.toUpperCase()}
        </div>
        <div style="font-size: 13px; color: #A1A1AA; margin-top: 2px;">
          ${h.description}
        </div>
        <div style="font-size: 11px; color: #52525B; margin-top: 4px;">
          ${new Date(h.timestamp).toUTCString()}
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background-color: #F59E0B; color: #09090B; font-size: 18px; font-weight: 800; padding: 8px 16px; border-radius: 8px;">
        CV
      </div>
      <h1 style="color: #FAFAFA; font-size: 24px; margin-top: 16px; margin-bottom: 4px;">
        Weekly Market Digest
      </h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">
        Top 5 highlights from the past 7 days
      </p>
    </div>

    <!-- Highlights Table -->
    <table style="width: 100%; border-collapse: collapse; background-color: #18181B; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr>
          <th style="padding: 12px 16px; text-align: left; font-size: 12px; color: #F59E0B; text-transform: uppercase; border-bottom: 1px solid #27272A;">
            Top Market Events
          </th>
        </tr>
      </thead>
      <tbody>
        ${highlightRows || `
          <tr>
            <td style="padding: 24px 16px; text-align: center; color: #71717A; font-size: 14px;">
              No significant events this week.
            </td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- CTA -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://cryptovision.com/dashboard" style="display: inline-block; background-color: #F59E0B; color: #09090B; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
        View Full Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #27272A;">
      <p style="color: #52525B; font-size: 12px; margin: 0;">
        CryptoVision — Crypto Futures Analytics
      </p>
      <p style="color: #52525B; font-size: 11px; margin-top: 8px;">
        <a href="https://cryptovision.com/settings" style="color: #71717A; text-decoration: underline;">
          Unsubscribe
        </a>
        from weekly digests
      </p>
    </div>
  </div>
</body>
</html>
`.trim();
}

/**
 * Send the weekly digest email to a single recipient.
 */
export async function sendWeeklyDigest(
  email: string,
  highlights: WeeklyHighlight[]
): Promise<boolean> {
  try {
    const html = renderWeeklyDigestEmail(highlights, email);

    const { error } = await getResend().emails.send({
      from: "CryptoVision <digest@cryptovision.com>",
      to: email,
      subject: `CryptoVision Weekly Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      html,
    });

    if (error) {
      console.error(`[WeeklyDigest] Failed to send to ${email}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[WeeklyDigest] Error sending to ${email}:`, err);
    return false;
  }
}
