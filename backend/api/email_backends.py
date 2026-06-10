from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
import urllib.request
import json
import logging

logger = logging.getLogger(__name__)

class ResendEmailBackend(BaseEmailBackend):
    """
    Backend de correo personalizado para enviar emails mediante la API HTTP de Resend
    en lugar de utilizar el protocolo SMTP. Esto evita el bloqueo de puertos (587/465)
    en entornos como Railway.
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        api_key = getattr(settings, 'RESEND_API_KEY', None)
        if not api_key:
            logger.error("RESEND_API_KEY no está configurada en los settings de Django.")
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY is not configured.")
            return 0

        sent_count = 0
        for message in email_messages:
            # Construcción del destinatario (Resend espera lista de correos)
            recipients = list(message.to)
            
            # Construir el payload compatible con la API de Resend
            payload = {
                "from": message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'ZenTask <onboarding@resend.dev>'),
                "to": recipients,
                "subject": message.subject,
                "text": message.body,
            }
            
            # Si el correo tiene contenido HTML alternativo (por ejemplo, correos ricos)
            if hasattr(message, 'alternatives') and message.alternatives:
                for alt_content, alt_mime in message.alternatives:
                    if alt_mime == 'text/html':
                        payload['html'] = alt_content

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method="POST"
            )

            try:
                with urllib.request.urlopen(req) as response:
                    res_body = response.read().decode('utf-8')
                    if response.status in [200, 201, 202]:
                        sent_count += 1
                    else:
                        logger.error(f"Error respuesta Resend API ({response.status}): {res_body}")
            except Exception as e:
                logger.error(f"Error llamando a Resend API: {e}")
                if not self.fail_silently:
                    raise

        return sent_count
