import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RouteList } from "../RouteList";
import { RouteModal } from "../RouteModal";
import { Route } from "../../../types/commute";

const mockRoute: Route = {
  id: 1,
  name: "Home to Office",
  origin: "Kraków Rynek",
  destination: "Kraków Business Park",
  distance_km: 12.5,
  latitude: 50.0647,
  longitude: 19.945,
  preferred_transport: "bike",
  created_at: "2026-11-15T12:00:00Z",
};

describe("RouteList Component", () => {
  it("renders routes with their name, endpoints, distance and transport badge", () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <RouteList
        routes={[mockRoute]}
        selectedRouteId={1}
        onSelectRoute={onSelect}
        onAddClick={onAdd}
        onEditClick={onEdit}
        onDeleteClick={onDelete}
      />
    );

    expect(screen.getByText("Home to Office")).toBeDefined();
    expect(screen.getByText(/12\.5 km/)).toBeDefined();
    expect(screen.getByText("Kraków Rynek")).toBeDefined();
    expect(screen.getByText("Kraków Business Park")).toBeDefined();
    expect(screen.getByText("Bicycle")).toBeDefined();
  });

  it("triggers selection when clicking on a route card", () => {
    const onSelect = vi.fn();
    render(
      <RouteList
        routes={[mockRoute]}
        selectedRouteId={null}
        onSelectRoute={onSelect}
        onAddClick={vi.fn()}
        onEditClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Home to Office"));
    expect(onSelect).toHaveBeenCalledWith(mockRoute);
  });

  it("renders empty state message when no routes are present", () => {
    render(
      <RouteList
        routes={[]}
        selectedRouteId={null}
        onSelectRoute={vi.fn()}
        onAddClick={vi.fn()}
        onEditClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />
    );

    expect(screen.getByText(/No commute routes defined yet/i)).toBeDefined();
  });
});

describe("RouteModal Component", () => {
  it("validates required fields before submitting create route", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<RouteModal isOpen={true} onClose={onClose} onSave={onSave} />);

    expect(screen.getByText("Create New Route")).toBeDefined();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Route Name/i), {
      target: { value: "Gym Trip" },
    });
    fireEvent.change(screen.getByLabelText(/Origin/i), {
      target: { value: "Apartment" },
    });
    fireEvent.change(screen.getByLabelText(/Destination/i), {
      target: { value: "Gym" },
    });
    fireEvent.change(screen.getByLabelText(/Distance/i), {
      target: { value: "3.5" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Route/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Gym Trip",
          origin: "Apartment",
          destination: "Gym",
          distance_km: 3.5,
          preferred_transport: "bike",
        })
      );
    });
  });

  it("pre-fills form inputs when editing an existing route", () => {
    render(
      <RouteModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        routeToEdit={mockRoute}
      />
    );

    expect(screen.getByText("Edit Route")).toBeDefined();
    expect(screen.getByDisplayValue("Home to Office")).toBeDefined();
  });

  it("renders geocoding quick buttons and toggles advanced weather coordinates", () => {
    render(<RouteModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    const fetchButtons = screen.getAllByRole("button", {
      name: /Pobierz współrzędne/i,
    });
    expect(fetchButtons.length).toBe(2);

    // Advanced weather coordinates are collapsed by default
    const toggleButton = screen.getByRole("button", {
      name: /Zaawansowane: Lokalizacja stacji pogodowej/i,
    });
    expect(toggleButton).toBeDefined();

    // Expand the accordion
    fireEvent.click(toggleButton);

    expect(
      screen.getByRole("button", { name: /Moja lokalizacja \(GPS\)/i })
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /Wykryj adres/i })).toBeDefined();
    expect(screen.getByLabelText(/Latitude/i)).toBeDefined();
    expect(screen.getByLabelText(/Longitude/i)).toBeDefined();
  });
});
