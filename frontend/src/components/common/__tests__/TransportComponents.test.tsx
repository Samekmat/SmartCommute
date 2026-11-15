import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransportIcon } from "../TransportIcon";
import { TransportBadge } from "../TransportBadge";
import { TransportModePicker } from "../TransportModePicker";

describe("Transport Components", () => {
  it("renders distinct icons for each transport mode with accessible titles", () => {
    const { rerender } = render(<TransportIcon mode="car" />);
    expect(screen.getByLabelText("Car transport")).toBeDefined();

    rerender(<TransportIcon mode="bike" />);
    expect(screen.getByLabelText("Bicycle transport")).toBeDefined();

    rerender(<TransportIcon mode="public_transit" />);
    expect(screen.getByLabelText("Public Transit transport")).toBeDefined();

    rerender(<TransportIcon mode="walk" />);
    expect(screen.getByLabelText("Walking transport")).toBeDefined();
  });

  it("renders transport badge with label and icon", () => {
    render(<TransportBadge mode="bike" />);
    expect(screen.getByText("Bicycle")).toBeDefined();
    expect(screen.getByLabelText("Bicycle transport")).toBeDefined();
  });

  it("renders transport badge without icon when showIcon is false", () => {
    render(<TransportBadge mode="walk" showIcon={false} />);
    expect(screen.getByText("Walking")).toBeDefined();
    expect(screen.queryByLabelText("Walking transport")).toBeNull();
  });

  it("renders transport mode picker and fires onSelectMode when clicked", () => {
    const onSelect = vi.fn();
    render(<TransportModePicker selectedMode="bike" onSelectMode={onSelect} />);

    const walkOption = screen.getByRole("radio", { name: /Walking/i });
    expect(walkOption.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(walkOption);
    expect(onSelect).toHaveBeenCalledWith("walk");
  });
});
