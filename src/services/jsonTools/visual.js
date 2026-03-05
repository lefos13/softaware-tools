/*
  Visual rendering utilities draw JSON previews directly on canvas so exported
  PNG output works reliably across browsers without foreignObject taint issues.
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

const drawRoundedRect = (context, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
};

const wrapLine = ({ context, text, maxWidth }) => {
  if (!text) {
    return [""];
  }

  const chunks = text.split(/(\s+)/).filter(Boolean);
  const lines = [];
  let current = "";

  const pushCurrent = () => {
    if (current) {
      lines.push(current.trimEnd());
      current = "";
    }
  };

  const chunkToLines = (chunk) => {
    const innerLines = [];
    let remaining = chunk;
    while (remaining.length > 0) {
      let consumed = "";
      for (let i = 1; i <= remaining.length; i += 1) {
        const candidate = remaining.slice(0, i);
        if (context.measureText(candidate).width <= maxWidth) {
          consumed = candidate;
          continue;
        }
        break;
      }

      if (!consumed) {
        consumed = remaining[0];
      }

      innerLines.push(consumed);
      remaining = remaining.slice(consumed.length);
    }
    return innerLines;
  };

  chunks.forEach((chunk) => {
    const candidate = `${current}${chunk}`;
    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      return;
    }

    if (/^\s+$/.test(chunk)) {
      pushCurrent();
      return;
    }

    if (current) {
      pushCurrent();
    }

    const splitLines = chunkToLines(chunk);
    splitLines.forEach((line, index) => {
      if (index < splitLines.length - 1) {
        lines.push(line);
      } else {
        current = line;
      }
    });
  });

  pushCurrent();
  return lines.length > 0 ? lines : [""];
};

export const renderJsonAsImage = async ({ toolId, input, options = {} }) => {
  const parsed = parseJsonInput(input);
  const jsonText = JSON.stringify(parsed, null, 2);
  const theme = themeStyles[options.theme] || themeStyles.light;
  const fontSize = Number(options.fontSize || 14);
  const lineHeight = fontSize * 1.45;
  const baseLines = jsonText.split("\n");
  const width = 1200;
  const padding = 44;
  const cardPadding = 28;
  const titleHeight = toolId === "screenshot-json" ? 58 : 0;
  const titleText = String(options.title || "JSON Preview");

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering context is unavailable");
  }

  context.font = `${fontSize}px "Avenir Next", "Segoe UI", sans-serif`;
  const maxTextWidth = width - padding * 2 - cardPadding * 2;
  const wrappedLines = baseLines.flatMap((line) =>
    wrapLine({ context, text: line, maxWidth: maxTextWidth })
  );
  const contentHeight = Math.ceil(
    wrappedLines.length * lineHeight + cardPadding * 2 + padding * 2 + titleHeight
  );
  const height = Math.min(Math.max(360, contentHeight), 2400);

  canvas.width = width;
  canvas.height = height;

  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);

  const cardX = padding;
  const cardY = padding;
  const cardWidth = width - padding * 2;
  const cardHeight = height - padding * 2;

  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 24);
  context.fillStyle = theme.card;
  context.fill();
  context.strokeStyle = "rgba(148,163,184,.35)";
  context.lineWidth = 1;
  context.stroke();

  let cursorY = cardY + cardPadding;
  if (toolId === "screenshot-json") {
    context.fillStyle = theme.accent;
    context.font = `700 24px "Avenir Next", "Segoe UI", sans-serif`;
    context.textBaseline = "top";
    context.fillText(titleText, cardX + cardPadding, cursorY);
    cursorY += titleHeight - 14;
  }

  context.fillStyle = theme.ink;
  context.font = `${fontSize}px "Avenir Next", "Segoe UI", sans-serif`;
  context.textBaseline = "top";

  const maxRows = Math.floor((cardHeight - cardPadding * 2 - titleHeight) / lineHeight);
  wrappedLines.slice(0, Math.max(maxRows, 1)).forEach((line, index) => {
    context.fillText(line, cardX + cardPadding, cursorY + index * lineHeight);
  });

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
        return;
      }
      reject(new Error("Could not export image from canvas"));
    }, "image/png");
  });
  const outputUrl = URL.createObjectURL(blob);

  return {
    outputUrl,
    outputBlob: blob,
    outputText: "Image generated successfully",
    mimeType: "image/png",
    extension: "png",
  };
};
