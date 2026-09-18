import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard } from "@/components/board/TaskCard";
import { Task } from "@/types/board";

describe("TaskCard component tests", () => {
  const mockTask: Task = {
    id: "task-test-1",
    title: "Verify rendering performance and metrics",
    columnId: "col-1",
    order: 0,
  };

  it("renders the task title", () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText("Verify rendering performance and metrics")).toBeDefined();
    expect(screen.getByText("#task-test-1")).toBeDefined();
    expect(screen.getByText("Order: 0")).toBeDefined();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);

    const cardButton = screen.getByRole("button", {
      name: `Task: ${mockTask.title}`,
    });
    fireEvent.click(cardButton);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has correct aria-label for accessibility", () => {
    render(<TaskCard task={mockTask} />);

    const cardButton = screen.getByRole("button");
    expect(cardButton.getAttribute("aria-label")).toBe(`Task: ${mockTask.title}`);
    expect(cardButton.getAttribute("aria-roledescription")).toBe("draggable card");
    expect(cardButton.tabIndex).toBe(0);
  });

  it("applies dragging styles when isDragging prop is true", () => {
    const { rerender } = render(<TaskCard task={mockTask} isDragging={false} />);
    let cardButton = screen.getByRole("button");
    expect(cardButton.className).toContain("cursor-grab");
    expect(cardButton.className).not.toContain("opacity-40");

    rerender(<TaskCard task={mockTask} isDragging={true} />);
    cardButton = screen.getByRole("button");
    expect(cardButton.className).toContain("opacity-40");
    expect(cardButton.className).toContain("cursor-grabbing");
    expect(cardButton.className).toContain("shadow-blue-500/20");
  });
});
