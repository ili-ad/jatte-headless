# Generated by Django 4.2.1 on 2025-06-28 14:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0003_add_misc_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
