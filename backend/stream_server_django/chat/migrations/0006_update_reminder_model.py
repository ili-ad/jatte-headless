from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0005_add_message_updated_at"),
    ]

    operations = [
        migrations.RenameField(
            model_name="reminder",
            old_name="user",
            new_name="created_by",
        ),
        migrations.RenameField(
            model_name="reminder",
            old_name="text",
            new_name="note",
        ),
        migrations.AddField(
            model_name="reminder",
            name="message",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="stream_server_django.reminders",
                to="chat.message",
            ),
        ),
        migrations.AddField(
            model_name="reminder",
            name="room",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="stream_server_django.reminders",
                to="chat.room",
            ),
        ),
        migrations.AlterField(
            model_name="reminder",
            name="created_by",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="created_reminders",
                to="accounts_supabase.customuser",
            ),
        ),
        migrations.AlterField(
            model_name="reminder",
            name="note",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
