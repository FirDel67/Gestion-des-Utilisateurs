# Generated by Django 5.0.1 on 2025-04-17 08:11

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main_app', '0002_user_profile'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='avatar',
        ),
    ]
