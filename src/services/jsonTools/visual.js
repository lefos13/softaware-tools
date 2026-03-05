/*
  Visual rendering utilities convert formatted JSON text into downloadable images
  without backend calls by using SVG foreignObject and canvas drawing.
*/
import { parseJsonInput } from "./engine/helpers";

const themeStyles = {
  light: {
    background: "#f8fafc",
    card: "#ffffff",
    ink: "#0f172a",
    accent: "#0d9488",
  },
  dark: {
    background: "#0b1220",
    card: "#111827",
    ink: "#e5e7eb",
    accent: "#34d399",
  },
};

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const renderJsonAsImage = async ({ toolId, input, options = {} }) => {
  const parsed = parseJsonInput(input);
  const jsonText = JSON.stringify(parsed, null, 2);
  const theme = themeStyles[options.theme] || themeStyles.light;
  const fontSize = Number(options.fontSize || 14);
  const lineHeight = fontSize * 1.45;
  const lines = jsonText.split("\n");
  const width = 1200;
  const padding = 44;
  const cardPadding = 28;
  const titleHeight = toolId === "screenshot-json" ? 58 : 0;
  const height = Math.min(
    Math.max(
      360,
      Math.ceil(lines.length * lineHeight + cardPadding * 2 + padding * 2 + titleHeight)
    ),
    2400
  );

  const titleText = String(options.title || "JSON Preview");
  const textHtml = escapeHtml(jsonText).replace(/\n/g, "<br />");

  const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject x="0" y="0" width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="
        width:${width}px;
        height:${height}px;
        background:${theme.background};
        padding:${padding}px;
        box-sizing:border-box;
        font-family:'Avenir Next','Segoe UI',sans-serif;
      ">
        <div style="
          width:100%;
          height:100%;
          border:1px solid rgba(148,163,184,.35);
          border-radius:24px;
          background:${theme.card};
          box-shadow:0 24px 40px rgba(15,23,42,.2);
          padding:${cardPadding}px;
          box-sizing:border-box;
          overflow:hidden;
        ">
          ${
            toolId === "screenshot-json"
              ? `<div style="font-size:24px;font-weight:700;color:${theme.accent};margin-bottom:14px;">${escapeHtml(titleText)}</div>`
              : ""
          }
          <pre style="
            margin:0;
            color:${theme.ink};
            font-size:${fontSize}px;
            line-height:${lineHeight}px;
            white-space:pre-wrap;
            overflow-wrap:anywhere;
          ">${textHtml}</pre>
        </div>
      </div>
    </foreignObject>
  </svg>`;

  const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not render image from JSON"));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const outputUrl = URL.createObjectURL(blob);

    return {
      outputUrl,
      outputBlob: blob,
      outputText: "Image generated successfully",
      mimeType: "image/png",
      extension: "png",
    };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};
