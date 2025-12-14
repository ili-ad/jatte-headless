from __future__ import annotations

from stream_server_django.chat_addons.agent.skills import Skill


class FixtureHelloSkill(Skill):
    name = "fixture.hello"
    description = "Fixture skill for discovery tests"
    input_schema = {}
    output_schema = {}
    enabled_by_default = False

    def can_handle(self, text, ctx) -> bool:  # pragma: no cover - not used in tests
        return True

    def execute(self, args: dict, ctx) -> dict:
        return {"message": "hello from fixture"}
