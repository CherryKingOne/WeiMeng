import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    """Service for sending emails and verification codes"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.sender_email = settings.SENDER_EMAIL or settings.SMTP_USER

    def generate_code(self, length: int = 6) -> str:
        """Generate a random numeric code"""
        return "".join(random.choices(string.digits, k=length))
    
    async def send_verification_code(self, email: str, code: str) -> bool:
        """
        Send verification code to email
        
        Args:
            email: Recipient email address
            code: Verification code
        
        Returns:
            True if sent successfully
        """
        subject = "Your Verification Code - AI Script Engine"
        
        # Create HTML content with styled verification code
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333333; margin-top: 0; text-align: center;">验证码 Verification Code</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        您好！您正在使用AI Script Engine服务，您的验证码是：
                    </p>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
                        <div style="background-color: #ffffff; border-radius: 6px; padding: 20px; display: inline-block; min-width: 280px;">
                            <span style="color: #2563eb; font-size: 36px; font-weight: bold; letter-spacing: 5px; font-family: 'Courier New', monospace; white-space: nowrap; display: inline-block;">
                                {code}
                            </span>
                        </div>
                    </div>
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                        该验证码将在 <strong style="color: #2563eb;">5分钟</strong> 后失效，请尽快使用。
                    </p>
                    <p style="color: #999999; font-size: 12px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                        如果这不是您的操作，请忽略此邮件。<br>
                        If you didn't request this code, please ignore this email.
                    </p>
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                        <p style="color: #999999; font-size: 12px; margin: 0;">
                            AI Script Engine © 2025
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text fallback
        plain_content = f"Your verification code is: {code}\nThis code will expire in 5 minutes."
        
        if self.smtp_host and self.smtp_user and self.smtp_password:
            return self._send_email_smtp(email, subject, plain_content, html_content)
        else:
            # Fallback to logging
            print(f"============================================")
            print(f"[EmailService] Sending code to {email}")
            print(f"[EmailService] Code: {code}")
            print(f"============================================")
            return True
    
    async def send_notification(self, email: str, subject: str, content: str) -> bool:
        """
        Send notification email
        
        Args:
            email: Recipient email address
            subject: Email subject
            content: Email content
        
        Returns:
            True if sent successfully
        """
        if self.smtp_host and self.smtp_user and self.smtp_password:
            return self._send_email_smtp(email, subject, content)
        else:
            print(f"[EmailService] Sending notification to {email}: {subject}")
            print(f"[EmailService] Content: {content}")
            return True

    def _send_email_smtp(self, to_email: str, subject: str, content: str, html_content: str = None) -> bool:
        """Send email using SMTP with optional HTML content"""
        try:
            msg = MIMEMultipart('alternative')
            msg["From"] = self.sender_email
            msg["To"] = to_email
            msg["Subject"] = subject
            
            # Attach plain text version
            msg.attach(MIMEText(content, "plain", "utf-8"))
            
            # Attach HTML version if provided
            if html_content:
                msg.attach(MIMEText(html_content, "html", "utf-8"))
            
            # Use SMTP_SSL for port 465 (SSL), SMTP with STARTTLS for other ports
            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            
            
            return True
        except Exception as e:
            print(f"[EmailService] Failed to send email via SMTP: {e}")
            return False


# Global instance
email_service = EmailService()
