import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCOREBOARD_PATH = ROOT / "audit" / "scoreboard.json"


def load_scoreboard() -> dict:
    return json.loads(SCOREBOARD_PATH.read_text())


def test_scoreboard_bound_count_matches_total():
    scoreboard = load_scoreboard()
    assert scoreboard["bound"] == scoreboard["totalOpIds"]


def test_scoreboard_missing_bindings_empty():
    scoreboard = load_scoreboard()
    assert scoreboard["missingBindings"] == []


def test_scoreboard_stragglers_empty():
    scoreboard = load_scoreboard()
    assert scoreboard["stragglerTokens"] == []


def test_scoreboard_auth_issues_empty():
    scoreboard = load_scoreboard()
    assert scoreboard["authIssues"] == []


def test_ws_events_verified_baseline():
    scoreboard = load_scoreboard()
    assert scoreboard["wsEventsVerified"] >= 10
