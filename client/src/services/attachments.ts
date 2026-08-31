import type { ChatAttachment } from "../types";

const MAX_FILES = 4;
const MAX_BYTES = 3_500_000;
const IMAGE_EDGE = 1280;
const TEXT_CHARS = 16_000;

const TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/css",
  "application/json",
  "application/javascript",
  "text/javascript",
]);

export const ACCEPT =
  "image/*,.txt,.md,.json,.csv,.pdf,.js,.ts,.tsx,.css,.html,.svg";

export function canAddMore(current: ChatAttachment[]): boolean {
  return current.length < MAX_FILES;
}

function id(): string {
  return crypto.randomUUID();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, IMAGE_EDGE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

export async function fromFiles(files: FileList | File[]): Promise<ChatAttachment[]> {
  const next: ChatAttachment[] = [];
  for (const file of Array.from(files).slice(0, MAX_FILES)) {
    if (file.size > MAX_BYTES) {
      throw new Error(`${file.name} is over 3.5 MB.`);
    }
    if (file.type.startsWith("image/")) {
      next.push({
        id: id(),
        name: file.name,
        mime: "image/jpeg",
        kind: "image",
        dataUrl: await resizeImage(file),
      });
      continue;
    }
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      next.push({
        id: id(),
        name: file.name,
        mime: "application/pdf",
        kind: "file",
        dataUrl: await fileToDataUrl(file),
      });
      continue;
    }
    if (
      TEXT_TYPES.has(file.type) ||
      /\.(txt|md|json|csv|js|ts|tsx|css|html|svg)$/i.test(file.name)
    ) {
      const text = (await file.text()).slice(0, TEXT_CHARS);
      next.push({
        id: id(),
        name: file.name,
        mime: file.type || "text/plain",
        kind: "file",
        text,
      });
      continue;
    }
    throw new Error(`${file.name} is not a supported file type.`);
  }
  return next;
}

export function slimForStorage(attachments: ChatAttachment[] | undefined): ChatAttachment[] | undefined {
  if (!attachments?.length) return undefined;
  return attachments.map((item) => {
    if (item.kind === "image") return item;
    return { id: item.id, name: item.name, mime: item.mime, kind: item.kind, text: item.text };
  });
}
