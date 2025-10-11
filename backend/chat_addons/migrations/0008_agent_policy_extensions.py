from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat_addons", "0007_agent_room_policy"),
    ]

    operations = [
        migrations.AddField(
            model_name="agentroompolicy",
            name="auto_reply_mode",
            field=models.CharField(
                choices=[
                    ("receptionist", "Receptionist"),
                    ("off", "Off"),
                    ("manual", "Manual"),
                ],
                default="receptionist",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="agentroompolicy",
            name="handoff_message",
            field=models.CharField(
                default="Let me connect you with a teammate.",
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name="agentroompolicy",
            name="tool_hop_cap",
            field=models.PositiveIntegerField(default=2),
        ),
        migrations.AddField(
            model_name="agentroompolicy",
            name="turn_cap",
            field=models.PositiveIntegerField(default=6),
        ),
        migrations.CreateModel(
            name="AgentRun",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("run_id", models.CharField(max_length=255, unique=True)),
                ("cid", models.CharField(max_length=255)),
                ("user_id", models.CharField(blank=True, max_length=255)),
                ("tools_used", models.JSONField(default=list)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("ok", "Ok"),
                            ("capped", "Capped"),
                            ("handoff", "Handoff"),
                            ("error", "Error"),
                        ],
                        max_length=16,
                    ),
                ),
                ("latency_ms", models.PositiveIntegerField(default=0)),
                ("tokens_in", models.PositiveIntegerField(default=0)),
                ("tokens_out", models.PositiveIntegerField(default=0)),
                (
                    "cost_usd",
                    models.DecimalField(decimal_places=6, default=0, max_digits=10),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ("-created_at", "-id"),
            },
        ),
    ]
