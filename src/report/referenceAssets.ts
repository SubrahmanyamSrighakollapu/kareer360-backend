import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "report-assets");
const cache = new Map<string, string>();

function load(relativePath: string, mime = "image/jpeg") {
  const cached = cache.get(relativePath);
  if (cached) return cached;
  const value = `data:${mime};base64,${fs.readFileSync(path.join(root, relativePath)).toString("base64")}`;
  cache.set(relativePath, value);
  return value;
}

export const referenceAssets = {
  cover: load("reference-pages/cover.jpg"),
  multipleIntelligences: load("theory/multiple-intelligences.png", "image/png"),
  riasec: load("theory/riasec.jpg"),
  domains: {
    analytical: load("theory/analytical-domain.png", "image/png"),
    interactive: load("theory/interactive-domain.png", "image/png"),
    introspective: load("theory/introspective-domain.png", "image/png"),
  },
  fullPages: [
    "career-options", "improve-logical", "improve-musical", "improve-naturalist",
    "improve-verbal", "improve-kinesthetic", "improve-interpersonal",
    "improve-visual", "improve-intrapersonal", "closing",
  ].map(name => load(`reference-pages/${name}.jpg`)),
};
