from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0007_add_custom_data"),
        ("chat", "0006_polloption"),
        ("chat", "0006_merge_0005_notification_0005_reaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="deleted_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
    ]
