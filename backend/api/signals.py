from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Task, Routine, Goal

def notify_sync(instance, action):
    channel_layer = get_channel_layer()
    group_name = f"user_{instance.user.id}"
    
    message = {
        "type": "sync_message",
        "message": {
            "action": action,
            "model": instance.__class__.__name__.lower(),
            "id": instance.id
        }
    }
    
    async_to_sync(channel_layer.group_send)(group_name, message)

@receiver(post_save, sender=Task)
@receiver(post_save, sender=Routine)
@receiver(post_save, sender=Goal)
def handle_save(sender, instance, created, **kwargs):
    action = "created" if created else "updated"
    notify_sync(instance, action)

@receiver(post_delete, sender=Task)
@receiver(post_delete, sender=Routine)
@receiver(post_delete, sender=Goal)
def handle_delete(sender, instance, **kwargs):
    notify_sync(instance, "deleted")
