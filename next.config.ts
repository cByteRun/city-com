import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.CITYCOM_BUILD_DIR || ".next",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  serverExternalPackages: ["exceljs", "pdfkit"],
  poweredByHeader: false,
  devIndicators: false,
};
export default config;
