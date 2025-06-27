from typing import Generic, Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseModelWithLabels(BaseModel, Generic[T]):
    @classmethod
    def from_orm_with_labels(cls: Type[T], obj: object) -> T:
        return cls.model_validate(obj)
