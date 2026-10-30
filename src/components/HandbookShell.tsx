"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { NavItem } from "@/lib/handbook";

const THEMES = [
  { id: "light", label: "밝게" },
  { id: "paper", label: "종이" },
  { id: "navy", label: "밤" },
] as const;
type ThemeId = (typeof THEMES)[number]["id"];
const THEME_KEY = "daolab-handbook-theme";

// 테마는 이 브라우저에만 저장합니다. 저장소를 못 쓰면 메모리에만 둡니다.
let memoryTheme: ThemeId = "light";
const themeListeners = new Set<() => void>();
function isTheme(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}
function readTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (isTheme(saved)) return saved;
  } catch {
    /* 저장소를 못 쓰는 브라우저 */
  }
  return memoryTheme;
}
function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function pickTheme(id: ThemeId) {
  memoryTheme = id;
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    /* 무시 */
  }
  themeListeners.forEach((l) => l());
}

/**
 * mdBook(엔스파이럴 핸드북)처럼 왼쪽 목차 + 본문.
 * 넓은 화면에서는 목차가 늘 보이고, 폰에서는 ☰ 로 엽니다.
 */
export function HandbookShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // 목차 상태는 그 페이지에서만 유효합니다. 다른 페이지로 가면 화면 폭에 맡깁니다
  // (넓으면 열림, 좁으면 닫힘).
  const [toggle, setToggle] = useState<{ path: string; state: "open" | "closed" } | null>(null);
  const sidebar = toggle && toggle.path === pathname ? toggle.state : null;
  const setSidebar = (state: "open" | "closed") => setToggle({ path: pathname, state });
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as ThemeId);
  const [query, setQuery] = useState("");

  const q = query.trim();
  const shown = q ? nav.filter((n) => n.title.includes(q)) : nav;

  return (
    <div className="hb" data-hb-theme={theme} data-sidebar={sidebar ?? undefined}>
      <header className="hb-bar">
        <button
          type="button"
          className="hb-icon"
          aria-label="목차 열고 닫기"
          aria-controls="hb-sidebar"
          onClick={() => {
            const wide = window.matchMedia("(min-width: 1000px)").matches;
            const visible = sidebar === null ? wide : sidebar === "open";
            setSidebar(visible ? "closed" : "open");
          }}
        >
          <span aria-hidden>☰</span>
        </button>
        <Link href={nav[0]?.href ?? "/"} className="hb-title">
          {title}
        </Link>
        <div className="hb-themes" role="group" aria-label="테마">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={theme === t.id}
              onClick={() => pickTheme(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <nav id="hb-sidebar" className="hb-sidebar" aria-label="목차">
        <label className="hb-search">
          <span className="sr-only">목차에서 찾기</span>
          <input
            id="hb-search"
            type="search"
            placeholder="목차에서 찾기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <ol className="hb-toc">
          {shown.map((n) => (
            <li key={n.href} data-depth={n.depth}>
              <Link
                href={n.href}
                aria-current={pathname === n.href ? "page" : undefined}
              >
                <strong>{n.number}.</strong> {n.title}
              </Link>
            </li>
          ))}
          {shown.length === 0 && <li className="hb-empty">찾는 장이 없습니다</li>}
        </ol>
      </nav>

      <button
        type="button"
        className="hb-scrim"
        aria-label="목차 닫기"
        tabIndex={-1}
        onClick={() => setSidebar("closed")}
      />

      <div className="hb-page">{children}</div>
    </div>
  );
}
