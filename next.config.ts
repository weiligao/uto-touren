import { execSync } from "child_process";
import type { NextConfig } from "next";

function getGitTag(): string {
  try {
    return execSync("git describe --tags --abbrev=0", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: getGitTag(),
  },
};

export default nextConfig;
