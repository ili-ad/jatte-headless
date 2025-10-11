import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = ROOT / "openapi" / "wireup_manifest.live.json"
SPEC_PATH = ROOT / "openapi" / "frontend-openapi-spec.yml"
SCOREBOARD_PATH = ROOT / "audit" / "scoreboard.json"


def collect_operation_ids(spec_path: Path) -> list[str]:
    operation_ids: list[str] = []
    for raw_line in spec_path.read_text().splitlines():
        line = raw_line.strip()
        if line.startswith("operationId:"):
            operation_ids.append(line.split(":", 1)[1].strip())
    return operation_ids


def test_every_openapi_operation_in_manifest():
    manifest = json.loads(MANIFEST_PATH.read_text())
    manifest_ops = [entry["operationId"] for entry in manifest]
    spec_ops = collect_operation_ids(SPEC_PATH)

    missing = sorted(set(spec_ops) - set(manifest_ops))
    assert not missing, f"Missing operations in manifest: {missing}"


def test_spec_operation_count_matches_scoreboard():
    spec_ops = set(collect_operation_ids(SPEC_PATH))
    scoreboard = json.loads(SCOREBOARD_PATH.read_text())

    assert scoreboard["totalOpIds"] == len(spec_ops)
    assert scoreboard["bound"] == len(spec_ops)
