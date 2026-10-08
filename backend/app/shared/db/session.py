#
# Imports
#

from pathlib import Path
from typing import AsyncGenerator, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Perso

from app.config import Env, get_settings
from app.shared.db.base import Base

#
# Bootstrap
#

settings = get_settings()

_engine: Optional[AsyncEngine] = None
_session_maker: Optional[async_sessionmaker[AsyncSession]] = None


def _sqlite_url(db_path: str) -> str:
    path = Path(db_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite+aiosqlite:///{path.as_posix()}"


async def bootstrap_db() -> None:
    """
        Create the SQLite engine, session maker and tables.
    """
    global _engine, _session_maker

    if _session_maker is not None:
        return

    url = _sqlite_url(settings.DB_PATH)

    _engine = create_async_engine(
        url,
        echo=settings.APP_ENV == Env.DEVELOPMENT,
    )
    _session_maker = async_sessionmaker(
        _engine,
        expire_on_commit=False,
    )

    # Import models so metadata is registered before create_all.
    # EXAMPLE — décommenter quand la feature items (ou une autre) est active :
    # import app.features.items.model  # noqa: F401
    import app.features.players.model  # noqa: F401
    import app.features.recruitment.model  # noqa: F401
    import app.features.physical.model  # noqa: F401


    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from app.features.players.controller import seed_players
    from app.features.recruitment.controller import seed_profiles
    async with _session_maker() as session:
        await seed_players(session)
        await seed_profiles(session)

    try:
        async with _engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        raise RuntimeError(
            "Error verifying SQLite database. "
            "Please check DB_PATH. \n"
            f"Error: {e}"
        ) from e


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
        Yields:
            - An AsyncSession scoped to the request.
    """
    if _session_maker is None:
        raise RuntimeError(
            "Trying to access database before it has been initialized."
        )

    async with _session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
