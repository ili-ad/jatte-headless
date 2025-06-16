from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('chat', '0008_add_room_data'),
        ('chat', '0008_flag'),
        ('chat', '0008_merge_20250616_1839'),
        ('chat', '0008_message_deleted_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserMute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('target', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='muted', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='muter', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'target')},
            },
        ),
    ]
