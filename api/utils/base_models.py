from pydantic import BaseModel


class BaseModelWithLabels(BaseModel):
    @classmethod
    def from_orm_with_labels(cls, obj, lang: str = "cs"):
        """Defaultní fallback – přebití možná v konkrétních modelech.
        ---
        Default fallback – can be overridden in specific models."""
        return cls.model_validate(obj)
