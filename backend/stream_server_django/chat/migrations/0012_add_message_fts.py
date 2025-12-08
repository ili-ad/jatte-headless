from django.db import migrations


def create_message_fts_index(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(
        """
        CREATE INDEX IF NOT EXISTS chat_message_body_fts_idx
        ON chat_message
        USING gin (to_tsvector('simple', coalesce(body, '')));
        """
    )


def drop_message_fts_index(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("DROP INDEX IF EXISTS chat_message_body_fts_idx;")


class Migration(migrations.Migration):
    dependencies = [
        ("stream_server_django.chat", "0011_message_attachments_preview"),
    ]

    operations = [
        migrations.RunPython(create_message_fts_index, drop_message_fts_index),
    ]
