############################################################
# EXAMPLE — feature CRUD de reference (desactivee).
# Garder ce dossier comme template pour de nouvelles features.
# Reactiver via app/shared/router.py et session.py.
############################################################

#
# Imports
#

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

# Perso

from app.shared.db.base import Base

#
# Model
#

class Item(Base):
    """
        Example ORM entity used as a feature template.
    """

    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
