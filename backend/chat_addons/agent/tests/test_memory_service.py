import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

from django.core.management import call_command
from django.test import TestCase

from chat_addons.agent.models import AgentMemoryEntry
from chat_addons.agent.services.memory import MemoryService

call_command("migrate", run_syncdb=True, verbosity=0)


class MemoryServiceTests(TestCase):
    def setUp(self) -> None:
        self.service = MemoryService(max_lines=60)
        self.cid = "messaging:test-memory"
        self.cap = self.service.max_lines

    def test_add_line_prunes_old_entries(self) -> None:
        total = self.cap + 3
        for idx in range(total):
            self.service.add_line(cid=self.cid, role="human", text=f"line {idx}")

        entries = list(
            AgentMemoryEntry.objects.filter(cid=self.cid).order_by("id").values_list("text", flat=True)
        )
        self.assertEqual(len(entries), self.cap)
        self.assertListEqual(
            entries,
            [f"line {idx}" for idx in range(total - self.cap, total)],
        )

    def test_recall_orders_by_keyword_then_recency(self) -> None:
        self.service.add_line(cid=self.cid, role="human", text="Initial greeting")
        self.service.add_line(cid=self.cid, role="agent", text="Customer name is Alice")
        self.service.add_line(cid=self.cid, role="agent", text="Discussed pricing details")
        self.service.add_line(cid=self.cid, role="human", text="Remember my name please")

        results = self.service.recall(cid=self.cid, query="name", k=2)
        self.assertEqual(len(results), 2)
        self.assertTrue(results[0]["text"].lower().startswith("remember my name"))
        self.assertIn("name", results[1]["text"].lower())

        recent = self.service.recall(cid=self.cid, query="", k=2)
        self.assertEqual([item["text"] for item in recent], [
            "Remember my name please",
            "Discussed pricing details",
        ])

    def test_list_memory_paginates_results(self) -> None:
        for idx in range(6):
            self.service.add_line(cid=self.cid, role="system", text=f"memo {idx}")

        first_page = self.service.list_memory(cid=self.cid, limit=2)
        self.assertEqual(len(first_page["results"]), 2)
        self.assertEqual(
            [entry["text"] for entry in first_page["results"]],
            ["memo 5", "memo 4"],
        )
        self.assertIsNotNone(first_page["next"])

        second_page = self.service.list_memory(
            cid=self.cid, limit=2, cursor=first_page["next"]
        )
        self.assertEqual(
            [entry["text"] for entry in second_page["results"]],
            ["memo 3", "memo 2"],
        )
        self.assertIsNotNone(second_page["next"])

        final_page = self.service.list_memory(
            cid=self.cid, limit=2, cursor=second_page["next"]
        )
        self.assertEqual([entry["text"] for entry in final_page["results"]], ["memo 1", "memo 0"])
        self.assertIsNone(final_page["next"])
