#
# Imports
#

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

# Perso

from app.shared.db.session import get_session

#
# Dependencies
#

DbSession = Annotated[AsyncSession, Depends(get_session)]
