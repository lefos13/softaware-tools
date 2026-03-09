/*
  The browser-side books counter mirrors the backend DOCX parsing rules so the
  pre-submit indicator reflects the same editable manuscript text the API bills.
*/
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  processEntities: false,
  trimValues: false,
});

const UNSUPPORTED_PARAGRAPH_CONTAINERS = new Set(["w:txbxContent"]);

const countWords = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const findNodeChildren = (nodes, targetName) => {
  for (const node of nodes || []) {
    if (node[targetName]) {
      return node[targetName];
    }

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        const nested = findNodeChildren(value, targetName);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return null;
};

const collectParagraphNodes = (nodes) => {
  const paragraphs = [];

  for (const node of nodes || []) {
    const [nodeName] = Object.keys(node).filter((key) => key !== ":@");
    if (!nodeName) {
      continue;
    }

    if (nodeName === "w:p") {
      paragraphs.push(node[nodeName]);
      continue;
    }

    if (UNSUPPORTED_PARAGRAPH_CONTAINERS.has(nodeName)) {
      continue;
    }

    const children = node[nodeName];
    if (Array.isArray(children)) {
      paragraphs.push(...collectParagraphNodes(children));
    }
  }

  return paragraphs;
};

const collectParagraphTextNodes = (nodes) => {
  const textNodes = [];

  for (const node of nodes || []) {
    const [nodeName] = Object.keys(node).filter((key) => key !== ":@");
    if (!nodeName) {
      continue;
    }

    if (UNSUPPORTED_PARAGRAPH_CONTAINERS.has(nodeName)) {
      continue;
    }

    if (nodeName === "w:t") {
      textNodes.push(node);
      continue;
    }

    const children = node[nodeName];
    if (Array.isArray(children)) {
      textNodes.push(...collectParagraphTextNodes(children));
    }
  }

  return textNodes;
};

const readTextNode = (node) =>
  Array.isArray(node?.["w:t"])
    ? node["w:t"]
        .filter((child) => Object.hasOwn(child, "#text"))
        .map((child) => child["#text"])
        .join("")
    : "";

const readParagraphText = (paragraphNodes) =>
  collectParagraphTextNodes(paragraphNodes)
    .map((node) => readTextNode(node))
    .join("");

export const countBooksTextWords = (value) => countWords(value);

export const countBooksDocxWords = async (file) => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    throw new Error("DOCX is missing word/document.xml");
  }

  const xmlText = await documentFile.async("string");
  const parsedDocument = xmlParser.parse(xmlText);
  const bodyNodes = findNodeChildren(parsedDocument, "w:body");

  if (!bodyNodes) {
    throw new Error("DOCX body content is missing");
  }

  const paragraphs = collectParagraphNodes(bodyNodes);

  if (paragraphs.length === 0) {
    throw new Error("DOCX has no editable body paragraphs");
  }

  return paragraphs.reduce(
    (sum, paragraphNodes) => sum + countWords(readParagraphText(paragraphNodes)),
    0
  );
};
