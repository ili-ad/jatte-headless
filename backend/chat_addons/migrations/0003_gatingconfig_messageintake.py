from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat_addons", "0002_roomagentflag"),
    ]

    operations = [
        migrations.CreateModel(
            name="GatingConfig",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.CharField(default="default", max_length=64, unique=True)),
                ("languages", models.JSONField(blank=True, default=list)),
                ("min_length", models.PositiveIntegerField(default=1)),
                ("max_length", models.PositiveIntegerField(default=1000)),
                ("min_interval_seconds", models.PositiveIntegerField(default=5)),
                ("blocklist", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Gating configuration",
                "verbose_name_plural": "Gating configurations",
                "app_label": "chat_addons",
            },
        ),
        migrations.CreateModel(
            name="MessageIntake",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("cid", models.CharField(max_length=255)),
                ("user_id", models.CharField(max_length=255)),
                ("text", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("reason", models.CharField(blank=True, max_length=255, null=True)),
                ("muted", models.BooleanField(default=False)),
                ("initial_broadcast", models.BooleanField(default=False)),
                ("decided_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "message",
                    models.OneToOneField(
                        on_delete=models.CASCADE,
                        related_name="intake",
                        to="chat.message",
                    ),
                ),
            ],
            options={
                "verbose_name": "Message intake",
                "verbose_name_plural": "Message intakes",
                "ordering": ("-created_at",),
                "app_label": "chat_addons",
            },
        ),
    ]
