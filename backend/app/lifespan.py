#
# Imports
#

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

# Perso

from app.shared.db.session import bootstrap_db

#
# Lifespan
#

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
        Application lifespan: init DB then yield.
    """
    await bootstrap_db()
    yield
