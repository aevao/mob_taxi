package services

import (
	"fmt"
	"html"
	"time"

	"github.com/taxi-project/backend/internal/mailer"
	"github.com/taxi-project/backend/internal/models"
)

func codeEmail(firstName, to, code string, purpose models.CodePurpose, ttl time.Duration) mailer.Message {
	subject := "Confirm your WHYP Taxi email"
	intro := "Use this code to confirm your email and finish creating your account."
	if purpose == models.PurposeResetPassword {
		subject = "Reset your WHYP Taxi password"
		intro = "Use this code to reset your password. If you didn't ask for this, you can ignore this email."
	}

	minutes := int(ttl.Minutes())
	greeting := "Hi"
	if firstName != "" {
		greeting = "Hi " + firstName
	}

	text := fmt.Sprintf("%s,\n\n%s\n\n%s\n\nThe code expires in %d minutes.\n\n— WHYP Taxi", greeting, intro, code, minutes)

	htmlBody := fmt.Sprintf(`<!doctype html>
<html><body style="margin:0;padding:24px;background:#F5F6F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0D0E11">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%%" style="max-width:440px;background:#FFFFFF;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:20px;font-weight:700;padding-bottom:16px">WHYP Taxi</td></tr>
      <tr><td style="font-size:15px;line-height:22px;padding-bottom:8px">%s,</td></tr>
      <tr><td style="font-size:15px;line-height:22px;color:#63676F;padding-bottom:24px">%s</td></tr>
      <tr><td align="center" style="font-size:34px;font-weight:700;letter-spacing:10px;background:#EEEEFE;color:#4F52DB;border-radius:12px;padding:18px 0">%s</td></tr>
      <tr><td style="font-size:13px;color:#9AA0A8;padding-top:20px">The code expires in %d minutes.</td></tr>
    </table>
  </td></tr></table>
</body></html>`, html.EscapeString(greeting), html.EscapeString(intro), code, minutes)

	return mailer.Message{To: to, Subject: subject, Text: text, HTML: htmlBody}
}

func decisionEmail(app models.DriverApplication) mailer.Message {
	subject := "You're approved to drive with WHYP"
	intro := "Good news — your driver application has been approved. Open the WHYP app to get on the road."
	if app.Status == models.ApplicationRejected {
		subject = "Update on your WHYP driver application"
		intro = "Thanks for applying to drive with WHYP. Unfortunately we can't approve your application right now."
	}

	greeting := "Hi " + app.FirstName
	note := ""
	if app.ReviewNote != "" {
		note = "Reason: " + app.ReviewNote
	}

	text := fmt.Sprintf("%s,\n\n%s\n\n%s\n\n— WHYP Taxi", greeting, intro, note)

	noteRow := ""
	if note != "" {
		noteRow = fmt.Sprintf(`<tr><td style="font-size:15px;line-height:22px;background:#F5F6F8;border-radius:12px;padding:16px">%s</td></tr>`, html.EscapeString(note))
	}

	htmlBody := fmt.Sprintf(`<!doctype html>
<html><body style="margin:0;padding:24px;background:#F5F6F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0D0E11">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%%" style="max-width:440px;background:#FFFFFF;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:20px;font-weight:700;padding-bottom:16px">WHYP Taxi</td></tr>
      <tr><td style="font-size:15px;line-height:22px;padding-bottom:8px">%s,</td></tr>
      <tr><td style="font-size:15px;line-height:22px;color:#63676F;padding-bottom:16px">%s</td></tr>
      %s
    </table>
  </td></tr></table>
</body></html>`, html.EscapeString(greeting), html.EscapeString(intro), noteRow)

	return mailer.Message{To: app.Email, Subject: subject, Text: text, HTML: htmlBody}
}
