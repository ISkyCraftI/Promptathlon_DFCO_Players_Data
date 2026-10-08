from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db.base import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)


class PlayerFollowup(Base):
    __tablename__ = "player_followups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    player_id: Mapped[str] = mapped_column(ForeignKey("players.id"), index=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
