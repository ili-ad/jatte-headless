from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("stream_server_django.accounts_supabase", "0002_userprofile_display_name_userprofile_extra_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Reminder",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("text", models.CharField(max_length=255)),
                ("remind_at", models.DateTimeField()),
                ("cid", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stream_server_django.reminders",
                        to="accounts_supabase.customuser",
                    ),
                ),
            ],
            options={
                "ordering": ("remind_at", "id"),
            },
        ),
    ]
