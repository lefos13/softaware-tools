/*
  Word-count tests keep the browser-side DOCX estimate aligned with the same
  editable-text rules used by the backend books service.
*/
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { countBooksDocxWords, countBooksTextWords } from "./booksWordCount";

const createDocxBlob = async (text: string): Promise<Blob> => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    </Types>`
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>`
  );
  zip.folder("word")?.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>${text}</w:t></w:r></w:p>
      </w:body>
    </w:document>`
  );

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const zipCopy = new Uint8Array(zipBytes.byteLength);
  zipCopy.set(zipBytes);
  return new Blob([zipCopy], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

describe("booksWordCount", () => {
  it("counts text words with the same whitespace split as the backend", () => {
    expect(countBooksTextWords("  μια   δοκιμη  κειμενου ")).toBe(3);
  });

  it("counts editable DOCX body words", async () => {
    const file = await createDocxBlob("μια μικρη δοκιμη");

    await expect(countBooksDocxWords(file)).resolves.toBe(3);
  });
});
