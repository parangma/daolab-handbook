import type { Metadata, Viewport } from "next";
import { HandbookShell } from "@/components/HandbookShell";
import { getHandbookNav, getHandbookTitle } from "@/lib/handbook";
import "./handbook.css";

export const metadata: Metadata = {
  title: { default: "다오랩 핸드북", template: "%s · 다오랩 핸드북" },
  description:
    "다오랩이 어떻게 굴러가는지 적은 살아 있는 문서. 합의, 가이드, 기수와 조, 이론 도구함.",
  // 외부 공개 여부를 정하기 전까지는 검색에 내보내지 않습니다 (들어가며 > 고치는 법).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body>
        <HandbookShell title={getHandbookTitle()} nav={getHandbookNav()}>
          {children}
        </HandbookShell>
      </body>
    </html>
  );
}
