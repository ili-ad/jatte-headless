from __future__ import annotations

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[4]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")
os.environ.setdefault("DATABASE_URL", "sqlite:///db.sqlite3")

import django

django.setup()

from stream_server_django.chat_addons.agent.skills.smalltalk.skill import (  # noqa: E402
    SmalltalkGreetSkill,
)


def test_greeting_can_handle_short_greetings() -> None:
    skill = SmalltalkGreetSkill()
    for text in [
        "hi",
        "hello",
        "hey",
        "bonjour",
        "salut",
        "hi there",
        "hello iliad",
        "help",
    ]:
        assert skill.can_handle(text, {}), f"Expected '{text}' to match"


def test_greeting_rejects_helpful_queries() -> None:
    skill = SmalltalkGreetSkill()
    for text in [
        "can you help me find some items identified as deco influenced on this website",
        "help me find chairs",
        "i need help finding the largest chair you offer",
        "hello, can you help me find chairs?",
        "hello there this is a long greeting message that should not match because it is too long",
    ]:
        assert not skill.can_handle(text, {}), f"Expected '{text}' to be ignored"
