from importlib import import_module
import pkgutil

from django.apps import AppConfig


class ChatAddonsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "chat_addons"
    verbose_name = "Chat Add-ons"

    def get_commands(self):  # type: ignore[override]
        commands = super().get_commands()
        try:
            package = import_module("chat_addons.agent.management.commands")
        except ModuleNotFoundError:
            return commands
        package_path = getattr(package, "__path__", None)
        if not package_path:
            return commands
        for _, name, is_pkg in pkgutil.iter_modules(package_path):
            if is_pkg:
                continue
            commands[name] = "chat_addons.agent"
        return commands
