import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export function renderMarkdown(source: string) {
  const html = marked.parse(source, { async: false, breaks: true });
  return DOMPurify.sanitize(html);
}

/** Estratto testuale di un contenuto markdown, per anteprime brevi (es. un hover). */
export function markdownExcerpt(source: string, maxLength = 220): string {
  const plain = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trimEnd() + "…";
}
