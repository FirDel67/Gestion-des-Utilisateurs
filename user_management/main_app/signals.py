# signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from .models import User
from django.contrib.contenttypes.models import ContentType


@receiver(post_save, sender=User)
def log_user_change(sender, instance, created, **kwargs):
    if created:
        LogEntry.objects.log_action(
            user_id=instance.pk,
            content_type_id=ContentType.objects.get_for_model(instance).pk,
            object_id=instance.pk,
            object_repr=str(instance),
            action_flag=ADDITION,
            change_message="User created"
        )
    else:
        LogEntry.objects.log_action(
            user_id=instance.pk,
            content_type_id=ContentType.objects.get_for_model(instance).pk,
            object_id=instance.pk,
            object_repr=str(instance),
            action_flag=CHANGE,
            change_message="User updated"
        )
