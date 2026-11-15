from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates
from sqlmodel import AutoString, Field, Relationship, SQLModel

TransportMode = Literal["car", "bike", "public_transit", "walk"]
CANONICAL_TRANSPORT_MODES: set[str] = {"car", "bike", "public_transit", "walk"}


class Route(SQLModel, table=True):
    __tablename__ = "route"
    __table_args__ = (
        CheckConstraint("distance_km > 0", name="check_route_distance_km_gt_zero"),
    )

    id: int | None = Field(default=None, primary_key=True)
    name: str
    origin: str
    destination: str
    distance_km: float = Field(gt=0)
    latitude: float = Field(default=50.0647)
    longitude: float = Field(default=19.9450)
    preferred_transport: TransportMode = Field(sa_type=AutoString)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    commute_logs: list["CommuteLog"] = Relationship(
        back_populates="route",
        cascade_delete=True,
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    @validates("distance_km")
    def validate_distance_km(self, key: str, value: float) -> float:
        if value <= 0:
            raise ValueError("distance_km must be greater than 0")
        return value

    @validates("preferred_transport")
    def validate_preferred_transport(self, key: str, value: str) -> str:
        if value not in CANONICAL_TRANSPORT_MODES:
            raise ValueError(
                f"preferred_transport must be one of {CANONICAL_TRANSPORT_MODES}"
            )
        return value


class CommuteLog(SQLModel, table=True):
    __tablename__ = "commute_log"
    __table_args__ = (
        CheckConstraint(
            "duration_minutes > 0", name="check_commute_log_duration_minutes_gt_zero"
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    route_id: int = Field(
        foreign_key="route.id",
        ondelete="CASCADE",
    )
    transport_mode: TransportMode = Field(sa_type=AutoString)
    duration_minutes: int = Field(gt=0)
    co2_saved_kg: float = Field(default=0.0)
    calories_burned: int = Field(default=0)
    logged_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    route: Route | None = Relationship(back_populates="commute_logs")

    @validates("duration_minutes")
    def validate_duration_minutes(self, key: str, value: int) -> int:
        if value <= 0:
            raise ValueError("duration_minutes must be greater than 0")
        return value

    @validates("transport_mode")
    def validate_transport_mode(self, key: str, value: str) -> str:
        if value not in CANONICAL_TRANSPORT_MODES:
            raise ValueError(
                f"transport_mode must be one of {CANONICAL_TRANSPORT_MODES}"
            )
        return value
