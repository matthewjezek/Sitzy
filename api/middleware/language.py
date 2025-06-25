from typing import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class LanguageMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        SUPPORTED_LANGUAGES = {"cs", "en"}

        lang = (
            request.headers.get("accept-language")
            or request.cookies.get("lang")
            or "cs"
        )
        lang = lang.lower().split(",")[0]
        request.state.lang = lang if lang in SUPPORTED_LANGUAGES else "cs"
        return await call_next(request)
