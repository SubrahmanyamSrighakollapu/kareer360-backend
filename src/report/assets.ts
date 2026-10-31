import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "report-assets");
const cache = new Map<string, string>();

function dataUri(relativePath: string) {
  const existing = cache.get(relativePath);
  if (existing) return existing;
  const extension = path.extname(relativePath).toLowerCase();
  const mime = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  const value = `data:${mime};base64,${fs.readFileSync(path.join(root, relativePath)).toString("base64")}`;
  cache.set(relativePath, value);
  return value;
}

export const reportAssets = {
  cover: dataUri("branding/cover.png"),
  multipleIntelligences: dataUri("theory/multiple-intelligences.png"),
  riasec: dataUri("theory/riasec.jpg"),
  domains: {
    analytical: dataUri("theory/analytical-domain.png"),
    interactive: dataUri("theory/interactive-domain.png"),
    introspective: dataUri("theory/introspective-domain.png"),
  },
  careers: {
    Music: dataUri("careers/music.png"),
    Medical: dataUri("careers/medical.png"),
    Engineering: dataUri("careers/engineering.png"),
    Design: dataUri("careers/design.png"),
    Management: dataUri("careers/management.png"),
    Accounts: dataUri("careers/accounts.png"),
    Education: dataUri("careers/education.png"),
    Sports: dataUri("careers/sports.png"),
    Media: dataUri("careers/media.png"),
    Acting: dataUri("careers/acting.png"),
  } as Record<string, string>,
};
