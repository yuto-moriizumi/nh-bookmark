/** Encode localization text to html tagged text.
 * Encoded text will have more accurate translation with DeepL */
export function encode(text: string) {
  const characterStack: string[] = [];
  let output = "";
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character !== "§") {
      output += character;
      continue;
    }
    // special character handling
    const nextCharacter = text[i + 1];
    if (nextCharacter === "!") {
      const lastCharacter = characterStack.pop();
      // if the lastCharacter is undefined, it means the orinal text is wrong and missing corresponding starting tag.
      // Ignore that case
      if (lastCharacter !== undefined) output += `</${lastCharacter}>`;
      i += 1;
    } else {
      output += `<${text[i + 1]}>`;
      characterStack.push(text[i + 1]);
      i += 1;
    }
  }
  return output;
}

/**
 * Decodes a encoded localization text.
 * @param text - The text to be decoded.
 * @returns The decoded text.
 */
export function decode(text: string) {
  let output = "";
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character !== "<") {
      output += character;
      continue;
    }
    // special character handling
    const nextCharacter = text[i + 1];
    if (nextCharacter === "/") {
      output += "§!";
      i += 3;
    } else {
      output += "§" + nextCharacter;
      i += 2;
    }
  }
  return output;
}
