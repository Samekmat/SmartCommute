from datetime import UTC, datetime
from typing import Literal

from sqlmodel import AutoString, Field, Relationship, SQLModel

TransportMode = Literal["car", "bike", "public_transit", "walk"]


class RouteBase(SQLModel):
    id: int | None = Field(default=None)
    name: str
    origin: str
    destination: str
    distance_km: float = Field(gt=0)
    latitude: float = Field(default=50.0647)
    longitude: float = Field(default=19.9450)
    preferred_transport: TransportMode
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Route(RouteBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    preferred_transport: TransportMode = Field(sa_type=AutoString)

    commute_logs: list["CommuteLog"] = Relationship(
        back_populates="route",
        cascade_delete=True,
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    def __init__(self, **data):
        RouteBase.model_validate(data)
        super().__init__(**data)


class CommuteLogBase(SQLModel):
    id: int | None = Field(default=None)
    route_id: int
    transport_mode: TransportMode
    duration_minutes: int = Field(gt=0)
    co2_saved_kg: float = Field(default=0.0)
    calories_burned: int = Field(default=0)
    logged_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CommuteLog(CommuteLogBase, table=True):
    __tablename__ = "commute_log"

    id: int | None = Field(default=None, primary_key=True)
    route_id: int = Field(
        foreign_key="route.id",
        ondelete="CASCADE",
    )
    transport_mode: TransportMode = Field(sa_type=AutoString)

    route: Route | None = Relationship(back_populates="commute_logs")

    def __init__(self, **data):
        CommuteLogBase.model_validate(data)
        super().__init__(**data)
