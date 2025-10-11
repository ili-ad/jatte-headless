from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat_addons", "0008_agent_policy_extensions"),
    ]

    operations = [
        migrations.CreateModel(
            name="AgentMemoryEntry",
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
                ("cid", models.CharField(db_index=True, max_length=255)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("human", "Human"),
                            ("agent", "Agent"),
                            ("system", "System"),
                        ],
                        max_length=16,
                    ),
                ),
                ("text", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "verbose_name": "Agent memory entry",
                "verbose_name_plural": "Agent memory entries",
                "app_label": "chat_addons",
            },
        ),
        migrations.AddIndex(
            model_name="agentmemoryentry",
            index=models.Index(fields=["cid", "-id"], name="agent_memory_cid_id_idx"),
        ),
    ]
