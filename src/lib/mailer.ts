import nodemailer from 'nodemailer'

export async function sendOtpEmail(toEmail: string, otpCode: string) {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = Number(process.env.SMTP_PORT) || 465
  const smtpFrom = process.env.SMTP_FROM || `"Aegis Collection" <${smtpUser}>`

  if (!smtpUser || !smtpPass) {
    throw new Error('Email pengirim OTP belum dikonfigurasi di file .env.local (GMAIL_USER / SMTP_USER).')
  }

  // Sanitasi password (hapus spasi jika user mengcopy dengan spasi)
  const cleanPassword = smtpPass.replace(/\s+/g, '')

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: cleanPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #18181b; font-size: 20px; font-weight: 800; letter-spacing: 1px; margin: 0;">AEGIS COLLECTION</h2>
        <p style="color: #71717a; font-size: 13px; margin-top: 4px;">Verifikasi Akun Baru</p>
      </div>
      
      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #3f3f46; font-size: 14px; margin-top: 0; margin-bottom: 16px;">Kode verifikasi (OTP) registrasi Anda adalah:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #18181b; background-color: #ffffff; padding: 12px 24px; display: inline-block; border-radius: 8px; border: 1px solid #e4e4e7;">
          ${otpCode}
        </div>
        <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 0; margin-top: 16px;">Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.</p>
      </div>

      <p style="color: #71717a; font-size: 12px; text-align: center; margin: 0;">
        Jika Anda tidak merasa melakukan pendaftaran di Aegis Collection, abaikan email ini.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: smtpFrom,
    to: toEmail,
    subject: 'Kode Verifikasi OTP Registrasi - Aegis Collection',
    html: htmlContent,
  })
}

export async function sendPasswordResetEmail(toEmail: string, otpCode: string) {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = Number(process.env.SMTP_PORT) || 465
  const smtpFrom = process.env.SMTP_FROM || `"Aegis Collection" <${smtpUser}>`

  if (!smtpUser || !smtpPass) {
    throw new Error('Email pengirim OTP belum dikonfigurasi di file .env.local (GMAIL_USER / SMTP_USER).')
  }

  const cleanPassword = smtpPass.replace(/\s+/g, '')

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: cleanPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #18181b; font-size: 20px; font-weight: 800; letter-spacing: 1px; margin: 0;">AEGIS COLLECTION</h2>
        <p style="color: #71717a; font-size: 13px; margin-top: 4px;">Reset Kata Sandi</p>
      </div>
      
      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #3f3f46; font-size: 14px; margin-top: 0; margin-bottom: 16px;">Kode OTP untuk mereset kata sandi Anda adalah:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #dc2626; background-color: #ffffff; padding: 12px 24px; display: inline-block; border-radius: 8px; border: 1px solid #fee2e2;">
          ${otpCode}
        </div>
        <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 0; margin-top: 16px;">Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.</p>
      </div>

      <p style="color: #71717a; font-size: 12px; text-align: center; margin: 0;">
        Jika Anda tidak merasa meminta reset kata sandi di Aegis Collection, abaikan email ini.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: smtpFrom,
    to: toEmail,
    subject: 'Kode Reset Kata Sandi - Aegis Collection',
    html: htmlContent,
  })
}

