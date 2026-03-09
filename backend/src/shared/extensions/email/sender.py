import aiosmtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
from typing import Optional
from config.settings import settings

logger = logging.getLogger(__name__)


class EmailSender:
    def __init__(self):
        self._host = settings.email.host
        self._port = settings.email.port
        self._user = settings.email.user
        self._password = settings.email.password
        self._use_tls = settings.email.use_tls
        self._from_name = settings.email.from_name
    
    async def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        logo_path: Optional[Path] = None
    ) -> bool:
        message = MIMEMultipart('related')
        message["From"] = f"{self._from_name} <{self._user}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        msg_alternative = MIMEMultipart('alternative')
        message.attach(msg_alternative)
        
        if text_content:
            msg_alternative.attach(MIMEText(text_content, 'plain', 'utf-8'))
        
        msg_alternative.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        if logo_path and logo_path.exists():
            try:
                with open(logo_path, 'rb') as f:
                    img_data = f.read()
                    img = MIMEImage(img_data)
                    img.add_header('Content-ID', '<logo>')
                    img.add_header('Content-Disposition', 'inline', filename='logo.png')
                    message.attach(img)
            except (OSError, ValueError, TypeError) as exc:
                logger.warning(
                    "Failed to attach email logo: path=%s error=%s",
                    logo_path,
                    exc,
                )
        
        try:
            await aiosmtplib.send(
                message,
                hostname=self._host,
                port=self._port,
                username=self._user,
                password=self._password,
                use_tls=self._use_tls
            )
            return True
        except (aiosmtplib.errors.SMTPException, OSError, TimeoutError) as exc:
            logger.error(
                "Email send failed: to=%s host=%s port=%s error=%s",
                to_email,
                self._host,
                self._port,
                exc,
            )
            if settings.app_env == "development":
                logger.info("[Dev Mode] Email would have been sent to: %s", to_email)
            return False
        except Exception:
            logger.exception(
                "Unexpected email send failure: to=%s host=%s port=%s",
                to_email,
                self._host,
                self._port,
            )
            if settings.app_env == "development":
                logger.info("[Dev Mode] Email would have been sent to: %s", to_email)
            return False

email_sender = EmailSender()
