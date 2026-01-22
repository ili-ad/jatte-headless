import importlib
import logging


def _reload_config(monkeypatch, **env):
    keys = ["AGENT_USE_RAG", "AGENT_RAG_STATE", "AGENT_RAG_ALLOW_PRIVATE"]
    for key in keys:
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    import stream_server_django.chat_addons.agent.config as config

    return importlib.reload(config)


def test_default_state_when_missing(monkeypatch):
    config = _reload_config(monkeypatch, AGENT_USE_RAG="1")
    assert config.AGENT_RAG_STATE_DEFAULT == "ILPUB"


def test_legacy_state_maps_to_ilpub(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)
    config = _reload_config(
        monkeypatch,
        AGENT_USE_RAG="1",
        AGENT_RAG_STATE="ILIAD",
    )
    assert config.AGENT_RAG_STATE_DEFAULT == "ILPUB"
    assert any(record.message == "agent.rag.state.legacy" for record in caplog.records)


def test_private_state_requires_opt_in(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)
    config = _reload_config(
        monkeypatch,
        AGENT_USE_RAG="1",
        AGENT_RAG_STATE="ILPRIV",
        AGENT_RAG_ALLOW_PRIVATE="0",
    )
    assert config.AGENT_RAG_STATE_DEFAULT == "ILPUB"
    assert any(
        record.message == "agent.rag.state.private_not_allowed"
        for record in caplog.records
    )


def test_private_state_allowed(monkeypatch):
    config = _reload_config(
        monkeypatch,
        AGENT_USE_RAG="1",
        AGENT_RAG_STATE="ILPRIV",
        AGENT_RAG_ALLOW_PRIVATE="1",
    )
    assert config.AGENT_RAG_STATE_DEFAULT == "ILPRIV"


def test_unknown_state_defaults_to_ilpub(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)
    config = _reload_config(
        monkeypatch,
        AGENT_USE_RAG="1",
        AGENT_RAG_STATE="NOPE",
    )
    assert config.AGENT_RAG_STATE_DEFAULT == "ILPUB"
    assert any(record.message == "agent.rag.state.unknown" for record in caplog.records)
