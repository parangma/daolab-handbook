import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHandbookPage, getHandbookPages, getHandbookTitle } from "@/lib/handbook";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return getHandbookPages().map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getHandbookPage((await params).slug ?? []);
  if (!page) return {};
  return { title: page.slug.length ? page.title : { absolute: getHandbookTitle() } };
}

export default async function HandbookPage({ params }: Props) {
  const page = getHandbookPage((await params).slug ?? []);
  if (!page) notFound();

  return (
    <article className="hb-content">
      <div className="hb-meta">
        <span>
          {page.number}장 · 초안 v0.1
        </span>
        <a href={page.editUrl} target="_blank" rel="noopener noreferrer">
          이 페이지 고치기 ↗
        </a>
      </div>
      <h1>{page.title}</h1>
      <div className="hb-body" dangerouslySetInnerHTML={{ __html: page.html }} />

      <nav className="hb-pager" aria-label="이전·다음 장">
        {page.prev ? (
          <Link href={page.prev.href} rel="prev">
            <small>← 이전</small>
            {page.prev.number}. {page.prev.title}
          </Link>
        ) : (
          <span />
        )}
        {page.next ? (
          <Link href={page.next.href} rel="next" className="hb-next">
            <small>다음 →</small>
            {page.next.number}. {page.next.title}
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <footer className="hb-foot">
        {getHandbookTitle()}은 다오랩 멤버가 함께 고쳐 쓰는 살아 있는 문서입니다. 엔스파이럴
        핸드북의 구조를 빌렸습니다. 개인 이름과 연락처는 싣지 않습니다.
        <br />
        원고는{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ko" target="_blank" rel="license noopener noreferrer">
          CC BY-SA 4.0
        </a>
        , 코드는 MIT 라이선스입니다. 발제를 요약한 페이지는 발제자 동의를 확인한 뒤 적용합니다.
      </footer>
    </article>
  );
}
