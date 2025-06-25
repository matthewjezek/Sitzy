from .messages import MESSAGES


def get_message(key: str, lang: str = "cs") -> str:
    return MESSAGES.get(key, {}).get(lang, f"!!{key}!!")
