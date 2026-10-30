import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더에 lockfile이 있어도 이 디렉터리를 루트로 잡습니다.
  turbopack: { root: path.resolve(".") },
};

export default nextConfig;
