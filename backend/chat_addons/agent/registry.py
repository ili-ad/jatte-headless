from __future__ import annotations

import importlib
import inspect
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Iterable, Sequence

from django.db import transaction

from .models import AgentRoomPolicy
from .skills import Skill

_SKILLS_PACKAGE = "chat_addons.agent.skills"


@dataclass(frozen=True)
class SkillMeta:
    name: str
    description: str
    input_schema: dict
    output_schema: dict
    enabled_by_default: bool


class SkillNotFoundError(LookupError):
    """Raised when an unknown skill is requested."""


def _skills_root() -> Path:
    return Path(importlib.import_module(_SKILLS_PACKAGE).__file__).resolve().parent


def _iter_skill_modules() -> Iterable[str]:
    root = _skills_root()
    importlib.invalidate_caches()
    for child in sorted(root.iterdir()):
        if not child.is_dir() or child.name.startswith("__"):
            continue
        module = child / "skill.py"
        if module.exists():
            yield f"{_SKILLS_PACKAGE}.{child.name}.skill"


def _iter_skill_classes() -> Iterable[type[Skill]]:
    for module_name in _iter_skill_modules():
        module = importlib.import_module(module_name)
        for obj in module.__dict__.values():
            if inspect.isclass(obj) and issubclass(obj, Skill) and obj is not Skill:
                yield obj


@lru_cache
def _load_all_skills() -> dict[str, Skill]:
    skills: dict[str, Skill] = {}
    for skill_cls in _iter_skill_classes():
        instance = skill_cls()
        if not getattr(instance, "name", ""):
            raise ValueError(f"Skill {skill_cls.__name__} is missing a name")
        if instance.name in skills:
            raise ValueError(f"Duplicate skill registered for name {instance.name}")
        skills[instance.name] = instance
    return skills


def clear_cache() -> None:
    """Clear the skill discovery cache (useful in tests)."""

    _load_all_skills.cache_clear()


def list_all() -> list[SkillMeta]:
    """Return metadata for all discovered skills."""

    metas: list[SkillMeta] = []
    for skill in _load_all_skills().values():
        metas.append(
            SkillMeta(
                name=skill.name,
                description=skill.description,
                input_schema=dict(skill.input_schema),
                output_schema=dict(skill.output_schema),
                enabled_by_default=bool(getattr(skill, "enabled_by_default", False)),
            )
        )
    metas.sort(key=lambda meta: meta.name)
    return metas


def _default_enabled_skills() -> set[str]:
    return {
        meta.name
        for meta in list_all()
        if meta.enabled_by_default
    }


def enabled_for_room(cid: str) -> list[Skill]:
    """Return instantiated skills enabled for the given room."""

    skills = _load_all_skills()
    policy = AgentRoomPolicy.objects.filter(cid=cid).first()
    if not policy or not policy.agent_enabled:
        return []

    enabled_names: Sequence[str]
    if policy.enabled_skills:
        enabled_names = policy.enabled_skills
    else:
        enabled_names = sorted(_default_enabled_skills())

    return [skills[name] for name in enabled_names if name in skills]


def execute(name: str, args: dict, ctx) -> dict:
    """Execute ``name`` with ``args`` and ``ctx`` using the registered skill."""

    skills = _load_all_skills()
    try:
        skill = skills[name]
    except KeyError as exc:  # pragma: no cover - defensive
        raise SkillNotFoundError(name) from exc
    return skill.execute(args, ctx)


def set_policy(cid: str, enabled: bool, skills: Sequence[str]) -> AgentRoomPolicy:
    """Persist a room policy for enabled skills."""

    skills = list(dict.fromkeys(skills))
    with transaction.atomic():
        policy, _ = AgentRoomPolicy.objects.select_for_update().get_or_create(cid=cid)
        policy.agent_enabled = enabled
        policy.enabled_skills = skills
        policy.save(update_fields=["agent_enabled", "enabled_skills", "updated_at"])
    return policy
