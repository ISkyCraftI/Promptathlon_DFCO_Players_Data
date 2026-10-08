from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db.base import Base


class DevelopmentPlayer(Base):
    __tablename__ = "development_players"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
