import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Lets the dev server serve its JS bundles/HMR socket to a phone on the
  // same WiFi network (accessed via this PC's LAN IP). Without this, Next
  // blocks those requests as cross-origin, so the page's HTML shows up but
  // the JS that hydrates React and starts the Phaser game never loads --
  // buttons appear but do nothing, the game canvas never appears.
  allowedDevOrigins: ["192.168.1.11"],
};

export default nextConfig;
