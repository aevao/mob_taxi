package mailer

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"mime"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
)

// smtpMailer sends through any STARTTLS SMTP server (Gmail: smtp.gmail.com:587
// with an app password). Gmail rewrites From to the authenticated account.
type smtpMailer struct {
	host     string
	port     string
	user     string
	password string
	from     string
}

func (m *smtpMailer) Send(ctx context.Context, msg Message) error {
	sender, err := mail.ParseAddress(m.from)
	if err != nil {
		return fmt.Errorf("smtp: invalid MAIL_FROM %q: %w", m.from, err)
	}

	deadline, ok := ctx.Deadline()
	if !ok {
		deadline = time.Now().Add(15 * time.Second)
	}

	dialer := net.Dialer{Deadline: deadline}
	conn, err := dialer.DialContext(ctx, "tcp", net.JoinHostPort(m.host, m.port))
	if err != nil {
		return fmt.Errorf("smtp: dial: %w", err)
	}
	_ = conn.SetDeadline(deadline)

	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		conn.Close()
		return fmt.Errorf("smtp: hello: %w", err)
	}
	defer client.Close()

	if err := client.StartTLS(&tls.Config{ServerName: m.host}); err != nil {
		return fmt.Errorf("smtp: starttls: %w", err)
	}
	if err := client.Auth(smtp.PlainAuth("", m.user, m.password, m.host)); err != nil {
		return fmt.Errorf("smtp: auth: %w", err)
	}
	if err := client.Mail(sender.Address); err != nil {
		return fmt.Errorf("smtp: mail from: %w", err)
	}
	if err := client.Rcpt(msg.To); err != nil {
		return fmt.Errorf("smtp: rcpt to: %w", err)
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp: data: %w", err)
	}
	if _, err := writer.Write(buildMIME(sender, msg)); err != nil {
		writer.Close()
		return fmt.Errorf("smtp: write: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("smtp: send: %w", err)
	}
	return client.Quit()
}

func buildMIME(from *mail.Address, msg Message) []byte {
	boundary := randomBoundary()

	var buf bytes.Buffer
	header := func(key, value string) {
		fmt.Fprintf(&buf, "%s: %s\r\n", key, value)
	}
	header("From", from.String())
	header("To", msg.To)
	header("Subject", mime.QEncoding.Encode("utf-8", msg.Subject))
	header("Date", time.Now().Format(time.RFC1123Z))
	header("Message-ID", fmt.Sprintf("<%s@%s>", randomBoundary(), domainOf(from.Address)))
	header("MIME-Version", "1.0")
	header("Content-Type", fmt.Sprintf(`multipart/alternative; boundary="%s"`, boundary))
	buf.WriteString("\r\n")

	writePart(&buf, boundary, "text/plain", msg.Text)
	if msg.HTML != "" {
		writePart(&buf, boundary, "text/html", msg.HTML)
	}
	fmt.Fprintf(&buf, "--%s--\r\n", boundary)
	return buf.Bytes()
}

func writePart(buf *bytes.Buffer, boundary, contentType, body string) {
	fmt.Fprintf(buf, "--%s\r\n", boundary)
	fmt.Fprintf(buf, "Content-Type: %s; charset=utf-8\r\n", contentType)
	buf.WriteString("Content-Transfer-Encoding: quoted-printable\r\n\r\n")
	qp := quotedprintable.NewWriter(buf)
	_, _ = qp.Write([]byte(body))
	_ = qp.Close()
	buf.WriteString("\r\n")
}

func randomBoundary() string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func domainOf(address string) string {
	if _, domain, ok := strings.Cut(address, "@"); ok {
		return domain
	}
	return "localhost"
}
