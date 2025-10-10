from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0010_message_custom_data_message_reply_to_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="attachments",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="message",
            name="preview",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
