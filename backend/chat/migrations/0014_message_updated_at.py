from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0013_merge_0010_poll_0011_merge_room_mute_0012_reminder"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
    ]
