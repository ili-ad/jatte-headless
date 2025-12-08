from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0010_message_custom_data_message_reply_to_and_more"),
        # If you really need chat_addons ordering, you can add a separate
        # ("chat_addons", "0010_rename_chat_addons_last_154576_idx_chat_addons_last_se_56d70a_idx_and_more"),
        # but *do not* depend on chat.0013 here.
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
