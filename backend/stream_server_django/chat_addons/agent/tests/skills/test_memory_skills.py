import os
import sys
from pathlib import Path
from unittest import mock

BASE_DIR = Path(__file__).resolve().parents[5]
BACKEND_DIR = BASE_DIR / "backend"
for path in (BASE_DIR, BACKEND_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

from django.test import SimpleTestCase

from stream_server_django.chat_addons.agent.skills.memory.skill import RecallSkill, RememberSkill


class RememberSkillTests(SimpleTestCase):
    def setUp(self) -> None:
        self.skill = RememberSkill()

    def test_can_handle_heuristics(self) -> None:
        self.assertTrue(self.skill.can_handle("Remember the code", {"cid": "room"}))
        self.assertTrue(self.skill.can_handle("Note to self: follow up", {"cid": "room"}))
        self.assertFalse(self.skill.can_handle("Please store this", {"cid": "room"}))

    @mock.patch("backend.chat_addons.agent.skills.memory.skill._MEMORY_SERVICE")
    def test_execute_adds_line(self, mock_service: mock.MagicMock) -> None:
        result = self.skill.execute({"text": "Send report"}, {"cid": "room-1"})
        mock_service.add_line.assert_called_once_with(
            cid="room-1", role="agent", text="Send report"
        )
        self.assertEqual(result, {"ok": True})


class RecallSkillTests(SimpleTestCase):
    def setUp(self) -> None:
        self.skill = RecallSkill()

    def test_can_handle_heuristics(self) -> None:
        self.assertTrue(self.skill.can_handle("What did I say earlier?", {"cid": "room"}))
        self.assertTrue(self.skill.can_handle("Can you recall our plan?", {"cid": "room"}))
        self.assertFalse(self.skill.can_handle("Tell me about shipping", {"cid": "room"}))

    @mock.patch("backend.chat_addons.agent.skills.memory.skill._MEMORY_SERVICE")
    def test_execute_returns_items(self, mock_service: mock.MagicMock) -> None:
        mock_service.recall.return_value = [
            {"text": "Order number is 123", "role": "human", "created_at": "2024-06-01T12:00:00Z"}
        ]

        result = self.skill.execute({"query": "order", "k": 1}, {"cid": "room-2"})

        mock_service.recall.assert_called_once_with(cid="room-2", query="order", k=1)
        self.assertEqual(
            result,
            {
                "items": [
                    {
                        "text": "Order number is 123",
                        "role": "human",
                        "created_at": "2024-06-01T12:00:00Z",
                    }
                ]
            },
        )
