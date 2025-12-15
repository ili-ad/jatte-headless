from __future__ import annotations

import os
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[4]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

from stream_server_django.chat_addons.agent import registry  # noqa: E402


_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")


def test_all_skills_follow_contracts() -> None:
    registry.clear_cache()
    metas = registry.list_all()
    assert metas, "Expected at least one skill to be discovered"

    for meta in metas:
        assert _NAME_PATTERN.fullmatch(meta.name), f"Invalid skill name: {meta.name}"

        input_schema = meta.input_schema
        assert isinstance(input_schema, dict), f"{meta.name} input_schema must be a dict"
        assert input_schema.get("type") == "object", f"{meta.name} input_schema type must be object"
        assert isinstance(
            input_schema.get("properties"), dict
        ), f"{meta.name} input_schema.properties must be a dict"

        output_schema = meta.output_schema
        assert isinstance(output_schema, dict), f"{meta.name} output_schema must be a dict"
        if output_schema:
            assert output_schema.get("type") == "object", (
                f"{meta.name} output_schema type must be object when present"
            )
            assert isinstance(
                output_schema.get("properties"), dict
            ), f"{meta.name} output_schema.properties must be a dict when present"
