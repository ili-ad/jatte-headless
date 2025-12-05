from chat_addons.agent.forms_metadata import extract_forms_metadata


def test_extract_forms_metadata_happy_path():
    text = (
        "Here is your answer.\n\n"
        "FORMS_JSON: "
        '[{"id": "FL_NTO_SUB", "reason": "Preserve lien rights"}, '
        '{"id": "FL_NOC", "reason": "Record NOC"}]'
    )

    clean, forms = extract_forms_metadata(text)

    assert "FORMS_JSON:" not in clean
    assert clean.startswith("Here is your answer.")
    assert forms == [
        {"id": "FL_NTO_SUB", "reason": "Preserve lien rights"},
        {"id": "FL_NOC", "reason": "Record NOC"},
    ]


def test_extract_forms_metadata_drops_unknown_ids():
    text = "FORMS_JSON: [{\"id\": \"UNKNOWN\", \"reason\": \"Nope\"}]"

    clean, forms = extract_forms_metadata(text)

    assert clean == ""
    assert forms == []


def test_extract_forms_metadata_handles_malformed_json():
    text = "Answer text.\nFORMS_JSON: [not-valid-json]"

    clean, forms = extract_forms_metadata(text)

    assert clean == "Answer text."
    assert forms == []


def test_extract_forms_metadata_without_trailer_returns_original():
    text = "No metadata here."

    clean, forms = extract_forms_metadata(text)

    assert clean == text
    assert forms == []
