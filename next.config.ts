import { createRequire } from "module";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const { version } = require("./package.json") as { version: string };

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${version}`,
  },
};

export default nextConfig;
