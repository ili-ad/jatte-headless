from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("chat_addons", "0001_initial"),
        ("chat", "0013_message_hidden_message_hidden_at_message_hidden_by"),
    ]

    operations = [
        migrations.CreateModel(
            name="RoomAgentFlag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("agent_enabled", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "room",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="agent_flag",
                        to="chat.room",
                    ),
                ),
            ],
            options={
                "verbose_name": "Agent room flag",
                "verbose_name_plural": "Agent room flags",
            },
        ),
    ]
