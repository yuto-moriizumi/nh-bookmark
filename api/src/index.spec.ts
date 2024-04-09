import { decode, encode } from "./utils";

describe("encode and decode", () => {
  it("should not modify text if there is no special characters", () => {
    const input = "Hello, World!";
    const expectedOutput = "Hello, World!";
    const encoded = encode(input);
    expect(encoded).toEqual(expectedOutput);
    expect(decode(encoded)).toEqual(input);
  });

  it("should wrap text inside the special characters", () => {
    const input = "§FHello§!, World!";
    const expectedOutput = "<F>Hello</F>, World!";
    const encoded = encode(input);
    expect(encoded).toEqual(expectedOutput);
    expect(decode(encoded)).toEqual(input);
  });

  it("should handle multiple decorations", () => {
    const input = "§FHello§!, §0World!§!";
    const expectedOutput = "<F>Hello</F>, <0>World!</0>";
    const encoded = encode(input);
    expect(encoded).toEqual(expectedOutput);
    expect(decode(encoded)).toEqual(input);
  });

  it("should ignore the closing tag if the starting tag is missing", () => {
    const input = "§FHello§!, §!World!§!";
    const expectedOutput = "<F>Hello</F>, World!";
    const encoded = encode(input);
    expect(encoded).toEqual(expectedOutput);
    expect(decode(encoded)).toEqual("§FHello§!, World!");
  });
});
