import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // vitestからインポート
import { createRoot } from "react-dom/client";
import { Root } from "../component";
import type { Mock } from 'vitest'; // Mock型をインポート

// Mock React's createRoot and render using vi.mock
vi.mock("react-dom/client", () => ({
  createRoot: vi.fn().mockReturnValue({ // jest.fn -> vi.fn
    render: vi.fn(), // jest.fn -> vi.fn
  }),
}));

// Mock the Root component using vi.mock
vi.mock("../component", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Root: vi.fn(() => React.createElement('div', null, 'Mocked Root') as any), // jest.fn -> vi.fn
}));

describe("index.ts", () => {
  let menu: HTMLUListElement;
  let initialHtml: string;

  beforeEach(() => {
    // Reset mocks before each test
    (createRoot as Mock).mockClear(); // jest.Mock -> Mock
    (createRoot as Mock).mockReturnValue({ // jest.Mock -> Mock
      render: vi.fn(), // jest.fn -> vi.fn
    });
    (Root as Mock).mockClear(); // jest.Mock -> Mock

    // Set up a basic DOM structure for testing
    initialHtml = document.body.innerHTML;
    menu = document.createElement("ul");
    document.body.appendChild(menu);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = initialHtml;
    // Clear any lingering mocks or timers if necessary
    vi.clearAllMocks(); // jest.clearAllMocks -> vi.clearAllMocks
    // Reset modules registry between tests to ensure the script runs anew
    vi.resetModules(); // jest.resetModules -> vi.resetModules
  });

  it("should append a new list item and render the Root component if #challenge-running does not exist", async () => {
    // Ensure the target element does not exist
    const challengeElement = document.getElementById("challenge-running");
    expect(challengeElement).toBeNull();

    // Execute the script from index.ts using dynamic import
    // vi.resetModules() in afterEach should handle isolation
    await import("../index");

    // Check if a new list item was added to the menu
    expect(menu.children.length).toBe(1);
    expect(menu.children[0].tagName).toBe("LI");

    // Check if createRoot was called with the new list item
    expect(createRoot).toHaveBeenCalledTimes(1);
    expect(createRoot).toHaveBeenCalledWith(menu.children[0]);

    // Check if render was called with the Root component
    const mockRender = (createRoot as Mock).mock.results[0].value.render; // jest.Mock -> Mock
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(mockRender).toHaveBeenCalledWith(Root());
  });

  it("should not do anything if #challenge-running exists", async () => {
    // Create the #challenge-running element
    const challengeElement = document.createElement("div");
    challengeElement.id = "challenge-running";
    document.body.appendChild(challengeElement);

    // Execute the script
    // vi.resetModules() in afterEach should handle isolation
    await import("../index");

    // Check that no list item was added
    expect(menu.children.length).toBe(0);

    // Check that createRoot and render were not called
    expect(createRoot).not.toHaveBeenCalled();

    // Clean up the added element
    document.body.removeChild(challengeElement);
  });

  it("should handle the case where no ul element exists", async () => {
     // Remove the ul element we added in beforeEach
     document.body.removeChild(menu);

     // Execute the script
     // vi.resetModules() in afterEach should handle isolation
     // Check if the dynamic import itself throws an error
     await expect(import("../index")).resolves.not.toThrow();

     // Check that createRoot was not called as menu is null
     expect(createRoot).not.toHaveBeenCalled();
  });
});
