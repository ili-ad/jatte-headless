from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('chat', '0014_message_updated_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='show_in_channel',
            field=models.BooleanField(default=False),
        ),
    ]

