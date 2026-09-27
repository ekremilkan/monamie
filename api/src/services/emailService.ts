import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter;

  /**
   * Email transporter'ı başlatır
   */
  static initialize(): void {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Email gönderir
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.initialize();
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        ...options,
      });
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      throw new Error('Email gönderilemedi');
    }
  }

  /**
   * OTP kodu içeren email şablonu
   */
  static generateOtpEmailTemplate(code: string, type: 'login' | 'register' | 'password_reset'): string {
    const titles = {
      login: 'Anmelden - Einmalpasswort',
      register: 'Registrierung - Einmalpasswort',
      password_reset: 'Passwort Zurücksetzen - Einmalpasswort',
    };

    const messages = {
      login: 'Verwenden Sie diesen Code, um sich in Ihr Konto einzuloggen.',
      register: 'Verwenden Sie diesen Code, um Ihre Registrierung abzuschließen.',
      password_reset: 'Verwenden Sie diesen Code, um Ihr Passwort zurückzusetzen.',
    };

    return `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${titles[type]}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
          }
          .header {
            background-color: #ff6b35;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 20px -30px;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #ff6b35;
            letter-spacing: 4px;
            margin: 20px 0;
            padding: 15px;
            background-color: white;
            border-radius: 5px;
            border: 2px solid #ff6b35;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mon Amie Chicken</h1>
            <h2>${titles[type]}</h2>
          </div>
          
          <p>Hallo,</p>
          <p>${messages[type]}</p>
          
          <div class="code">
            ${code}
          </div>
          
          <div class="warning">
            <strong>Wichtig:</strong>
            <ul style="text-align: left; margin: 10px 0;">
              <li>Dieser Code läuft in 2 Minuten ab</li>
              <li>Verwenden Sie diesen Code niemals mit anderen</li>
              <li>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail</li>
            </ul>
          </div>
          
          <p>Mit freundlichen Grüßen,<br>
          <strong>Mon Amie Chicken Team</strong></p>
          
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * OTP email'i gönderir
   */
  static async sendOtpEmail(email: string, code: string, type: 'login' | 'register' | 'password_reset'): Promise<void> {
    const subjects = {
      login: 'Anmelden - Ihr Einmalpasswort',
      register: 'Registrierung - Ihr Einmalpasswort',
      password_reset: 'Passwort Zurücksetzen - Ihr Einmalpasswort',
    };

    const html = this.generateOtpEmailTemplate(code, type);

    await this.sendEmail({
      to: email,
      subject: subjects[type],
      html,
    });
  }

  /**
   * Email konfigürasyonunun doğruluğunu kontrol eder
   */
  static async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.initialize();
      }
      
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email konfigürasyon hatası:', error);
      return false;
    }
  }
}