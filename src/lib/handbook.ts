import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Marked } from "marked";

/**
 * 다오랩 8기 핸드북
 *
 * 엔스파이럴 핸드북처럼 mdBook 형식을 따릅니다.
 * content/SUMMARY.md 의 목록 순서가 곧 목차이고,
 * 목록에 있는 마크다운 파일만 페이지가 됩니다.
 *
 *   - [제목](경로.md)          1단계
 *     - [제목](폴더/경로.md)   2단계 (공백 두 칸 들여쓰기)
 *       - [제목](폴더/경로.md) 3단계 (공백 네 칸)
 */

const ROOT = path.join(process.cwd(), "content");
export const HANDBOOK_BASE = "";
const EDIT_BASE =
  "https://github.com/parangma/daolab-handbook/edit/main/content";

export type HandbookPage = {
  /** 1, 1.1, 2 … */
  number: string;
  title: string;
  depth: number;
  /** content/ 기준 파일 경로 */
  file: string;
  slug: string[];
  href: string;
};

export type NavItem = Pick<HandbookPage, "number" | "title" | "depth" | "href">;

function fail(file: string, msg: string): never {
  throw new Error(`[handbook] ${file}: ${msg}`);
}

function slugOf(file: string): string[] {
  const parts = file.replace(/\.md$/, "").split("/");
  if (parts.at(-1) === "README") parts.pop();
  return parts;
}

function hrefOf(slug: string[]) {
  return slug.length ? `${HANDBOOK_BASE}/${slug.join("/")}` : `${HANDBOOK_BASE}/`;
}

let cache: { title: string; pages: HandbookPage[] } | null = null;

function load() {
  if (cache) return cache;
  const summaryFile = path.join(ROOT, "SUMMARY.md");
  if (!existsSync(summaryFile)) fail("SUMMARY.md", "파일이 없습니다");
  const lines = readFileSync(summaryFile, "utf8").split("\n");

  const title =
    lines.find((l) => l.startsWith("# "))?.slice(2).trim() ?? "핸드북";
  const pages: HandbookPage[] = [];
  const counter: number[] = [];

  for (const line of lines) {
    const m = line.match(/^(\s*)- \[(.+?)\]\((.+?\.md)\)\s*$/);
    if (!m) continue;
    const depth = Math.floor(m[1].length / 2);
    if (depth > 2) fail("SUMMARY.md", `3단계까지만 씁니다: ${line.trim()}`);
    if (depth > counter.length) fail("SUMMARY.md", `들여쓰기가 한 번에 두 단계 깊어졌습니다: ${line.trim()}`);
    counter.length = depth + 1;
    counter[depth] = (counter[depth] ?? 0) + 1;
    const file = m[3];
    if (!existsSync(path.join(ROOT, file)))
      fail("SUMMARY.md", `${file} 파일이 없습니다`);
    const slug = slugOf(file);
    pages.push({
      number: counter.join("."),
      title: m[2].trim(),
      depth,
      file,
      slug,
      href: hrefOf(slug),
    });
  }
  if (pages.length === 0) fail("SUMMARY.md", "목차가 비어 있습니다");
  cache = { title, pages };
  return cache;
}

export function getHandbookTitle() {
  return load().title;
}

export function getHandbookPages() {
  return load().pages;
}

export function getHandbookNav(): NavItem[] {
  return load().pages.map(({ number, title, depth, href }) => ({
    number,
    title,
    depth,
    href,
  }));
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 이름은 걸러낼 수 없지만, 연락처와 이미지는 기계적으로 막습니다. */
function assertSafe(file: string, text: string) {
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text))
    fail(file, "이메일 주소로 보이는 글이 있습니다");
  if (/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/.test(text))
    fail(file, "전화번호로 보이는 글이 있습니다");
  if (/!\[[^\]]*\]\([^)]+\)/.test(text))
    fail(file, "이미지는 넣지 않습니다 (얼굴 사진 방지)");
}

/** 다른 핸드북 파일로 가는 상대 링크(../guides/x.md)를 페이지 주소로 바꿉니다. */
function rewriteLinks(file: string, text: string) {
  const dir = path.posix.dirname(file);
  return text.replace(
    /\]\((?!https?:)([^)\s#]+\.md)(#[^)\s]*)?\)/g,
    (_all, target: string, hash = "") => {
      const resolved = path.posix.normalize(path.posix.join(dir, target));
      if (!existsSync(path.join(ROOT, resolved)))
        fail(file, `링크한 ${target} 파일이 없습니다`);
      return `](${hrefOf(slugOf(resolved))}${hash})`;
    },
  );
}

const md = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => escapeHtml(text),
    link({ href, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const external = /^https?:/.test(href);
      return external
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${inner}</a>`
        : `<a href="${href}">${inner}</a>`;
    },
  },
});

export function getHandbookPage(slug: string[]) {
  const pages = load().pages;
  const index = pages.findIndex((p) => p.slug.join("/") === slug.join("/"));
  if (index === -1) return null;
  const page = pages[index];
  const text = readFileSync(path.join(ROOT, page.file), "utf8");
  assertSafe(page.file, text);
  const html = md.parse(rewriteLinks(page.file, text)) as string;
  return {
    ...page,
    html,
    editUrl: `${EDIT_BASE}/${page.file}`,
    prev: index > 0 ? pages[index - 1] : null,
    next: index < pages.length - 1 ? pages[index + 1] : null,
  };
}
