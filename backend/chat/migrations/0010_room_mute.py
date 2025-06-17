from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):
    dependencies = [
        ('chat', '0009_merge_20250616_1945'),
        ('chat', '0009_merge_20250616_1951'),
        ('chat', '0009_merge_20250616_1956'),
        ('chat', '0009_user_mute'),
    ]

    operations = [
        migrations.CreateModel(
            name='RoomMute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='chat.room')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'room')},
            },
        ),
    ]
