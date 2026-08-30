import nodemailer from 'nodemailer'

function getMailTransporter() {
  const resendApiKey = process.env.RESEND_API_KEY
  const smtpUser = process.env.SMTP_USER || (resendApiKey ? 'resend' : process.env.GMAIL_USER)
  const smtpPass = process.env.SMTP_PASS || resendApiKey || process.env.GMAIL_APP_PASSWORD
  const smtpHost = process.env.SMTP_HOST || (resendApiKey ? 'smtp.resend.com' : 'smtp.gmail.com')
  const smtpPort = Number(process.env.SMTP_PORT) || 465
  let smtpFrom = process.env.SMTP_FROM || (resendApiKey ? '"Aegis Collection" <noreply@send.aegiscollection.biz.id>' : `"Aegis Collection" <${smtpUser}>`)
  if (smtpFrom.includes('resend.dev')) {
    smtpFrom = '"Aegis Collection" <noreply@send.aegiscollection.biz.id>'
  }

  if (!smtpUser || !smtpPass) {
    return null
  }

  const cleanPassword = smtpPass.replace(/\s+/g, '')

  return {
    transporter: nodemailer.createTransport({
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
    }),
    from: smtpFrom,
  }
}

export async function sendOtpEmail(toEmail: string, otpCode: string) {
  const mailSetup = getMailTransporter()
  if (!mailSetup) {
    throw new Error('Email pengirim OTP belum dikonfigurasi di file .env.local (GMAIL_USER / SMTP_USER / RESEND_API_KEY).')
  }

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

  await mailSetup.transporter.sendMail({
    from: mailSetup.from,
    to: toEmail,
    subject: 'Kode Verifikasi OTP Registrasi - Aegis Collection',
    html: htmlContent,
  })
}

export async function sendPasswordResetEmail(toEmail: string, otpCode: string) {
  const mailSetup = getMailTransporter()
  if (!mailSetup) {
    throw new Error('Email pengirim OTP belum dikonfigurasi di file .env.local (GMAIL_USER / SMTP_USER / RESEND_API_KEY).')
  }

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

  await mailSetup.transporter.sendMail({
    from: mailSetup.from,
    to: toEmail,
    subject: 'Kode Reset Kata Sandi - Aegis Collection',
    html: htmlContent,
  })
}

export async function sendOrderCreatedEmail(toEmail: string, orderId: number, totalAmount: number, shippingAddress: string) {
  try {
    const mailSetup = getMailTransporter()
    if (!mailSetup || !toEmail) return

    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAmount)

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #18181b; font-size: 22px; font-weight: 800; letter-spacing: 1px; margin: 0;">AEGIS COLLECTION</h2>
          <p style="color: #16a34a; font-size: 14px; font-weight: 700; margin-top: 4px;">🎉 Pesanan #${orderId} Berhasil Dibuat!</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #334155; font-size: 14px; margin-top: 0;">Halo, Terima kasih telah berbelanja di <strong>Aegis Collection</strong>.</p>
          <div style="margin: 16px 0; padding: 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1;">
            <p style="margin: 4px 0; color: #475569; font-size: 13px;"><strong>No. Pesanan:</strong> #${orderId}</p>
            <p style="margin: 4px 0; color: #475569; font-size: 13px;"><strong>Total Pembayaran:</strong> <span style="color: #16a34a; font-weight: 800;">${formattedPrice}</span></p>
            <p style="margin: 4px 0; color: #475569; font-size: 13px;"><strong>Alamat Pengiriman:</strong> ${shippingAddress}</p>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">Pesanan Anda sedang diproses oleh tim kami. Anda dapat mengecek status pesanan kapan saja di menu Pesanan Saya.</p>
        </div>

        <div style="text-align: center;">
          <a href="https://www.aegiscollection.biz.id/orders/${orderId}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px;">Lihat Rincian Pesanan</a>
        </div>
      </div>
    `

    await mailSetup.transporter.sendMail({
      from: mailSetup.from,
      to: toEmail,
      subject: `Konfirmasi Pesanan #${orderId} - Aegis Collection`,
      html: htmlContent,
    })
  } catch (err) {
    console.error('[sendOrderCreatedEmail Error]', err)
  }
}

export async function sendOrderStatusNotificationEmail(
  toEmail: string,
  orderId: number,
  newStatus: string,
  trackingNumber?: string | null,
  courierName?: string | null
) {
  try {
    const mailSetup = getMailTransporter()
    if (!mailSetup || !toEmail) return

    const STATUS_MAP: Record<string, { label: string; desc: string; color: string }> = {
      pending: { label: 'Menunggu Pembayaran', desc: 'Pesanan Anda menunggu konfirmasi pembayaran.', color: '#d97706' },
      pending_confirmation: { label: 'Menunggu Konfirmasi', desc: 'Bukti pembayaran Anda telah diterima dan sedang diverifikasi oleh tim kami.', color: '#0284c7' },
      paid: { label: 'Pembayaran Dikonfirmasi', desc: 'Pembayaran Anda telah diterima! Pesanan sedang disiapkan.', color: '#16a34a' },
      shipped: { label: 'Dalam Pengiriman', desc: `Pesanan Anda sedang dikirim oleh kurir ${courierName || 'kami'}.${trackingNumber ? ` No. Resi: ${trackingNumber}` : ''}`, color: '#2563eb' },
      completed: { label: 'Pesanan Selesai', desc: 'Pesanan Anda telah diterima. Terima kasih telah berbelanja di Aegis Collection!', color: '#16a34a' },
      cancelled: { label: 'Pesanan Dibatalkan', desc: 'Pesanan Anda telah dibatalkan.', color: '#dc2626' },
    }

    const info = STATUS_MAP[newStatus] || { label: newStatus, desc: 'Status pesanan Anda telah diperbarui.', color: '#18181b' }

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #18181b; font-size: 22px; font-weight: 800; letter-spacing: 1px; margin: 0;">AEGIS COLLECTION</h2>
          <p style="color: ${info.color}; font-size: 15px; font-weight: 700; margin-top: 4px;">Update Status Pesanan #${orderId}</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 16px;">
            <span style="display: inline-block; background-color: ${info.color}; color: #ffffff; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px;">
              ${info.label}
            </span>
          </div>
          <p style="color: #334155; font-size: 14px; text-align: center; margin: 0;">${info.desc}</p>
        </div>

        <div style="text-align: center;">
          <a href="https://www.aegiscollection.biz.id/orders/${orderId}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px;">Lihat Rincian Pesanan</a>
        </div>
      </div>
    `

    await mailSetup.transporter.sendMail({
      from: mailSetup.from,
      to: toEmail,
      subject: `Update Pesanan #${orderId}: ${info.label} - Aegis Collection`,
      html: htmlContent,
    })
  } catch (err) {
    console.error('[sendOrderStatusNotificationEmail Error]', err)
  }
}
