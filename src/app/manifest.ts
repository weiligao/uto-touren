import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UtoTouren",
    short_name: "UtoTouren",
    description: "Touren und Kurse der SAC-Sektion Uto suchen, filtern und exportieren.",
    icons: [
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon-512.png",   sizes: "512x512",  type: "image/png" },
    ],
    start_url: "/",
    display: "browser",
    theme_color: "#2563eb",
    background_color: "#ffffff",
  };
}
