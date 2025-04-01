// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// TextEncoder/TextDecoder for JSDOM
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

// Mock the document.URL property
Object.defineProperty(window, "URL", {
  value: {
    createObjectURL: jest.fn(),
  },
});

// Mock document.getElementsByTagName for components that use it
document.getElementsByTagName = jest.fn().mockImplementation((tagName) => {
  if (tagName === "h1") {
    return {
      item: jest.fn().mockReturnValue(document.createElement("h1")),
    };
  }
  return {
    item: jest.fn().mockReturnValue(null),
  };
});

// Mock axios
jest.mock("axios", () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  }),
  get: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock createPortal
jest.mock("react-dom", () => {
  const originalModule = jest.requireActual("react-dom");
  return {
    ...originalModule,
    createPortal: jest.fn((element) => element),
  };
});

// Mock DOMParser
global.DOMParser = jest.fn().mockImplementation(() => ({
  parseFromString: jest
    .fn()
    .mockReturnValue(document.implementation.createHTMLDocument()),
}));

// Set document.URL for tests
Object.defineProperty(document, "URL", {
  value: "https://example.com/test",
  writable: true,
});
