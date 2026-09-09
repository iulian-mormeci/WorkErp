import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export function renderMarkdown(source: string) {
  const html = marked.parse(source, { async: false, breaks: true });
  return DOMPurify.sanitize(html);
}
