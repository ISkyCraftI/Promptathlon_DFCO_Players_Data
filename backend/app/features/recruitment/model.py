from sqlalchemy import JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db.base import Base


class RecruitmentProfile(Base):
    """Profil de poste défini par le staff : pondération des sous-attributs + critères."""

    __tablename__ = "recruitment_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    weights: Mapped[dict] = mapped_column(JSON, nullable=False)
    max_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_overall: Mapped[int | None] = mapped_column(Integer, nullable=True)
