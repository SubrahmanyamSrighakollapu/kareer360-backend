import fs from "node:fs";
import path from "node:path";
const root=path.resolve(process.cwd(),"report-assets/learning-styles"),cache=new Map<string,string>();
function load(name:string){const cached=cache.get(name);if(cached)return cached;const value=`data:image/jpeg;base64,${fs.readFileSync(path.join(root,name)).toString("base64")}`;cache.set(name,value);return value}
export const learningStyleAssets={cover:load("cover.jpeg"),theory:load("theory.jpeg"),summary:load("summary-template.jpeg"),visualTemplate:load("visual-template.jpeg"),auditoryTemplate:load("auditory-template.jpeg"),kinestheticTemplate:load("kinesthetic-template.jpeg"),closing:load("closing.jpeg"),icons:{visual:load("visual.jpeg"),auditory:load("auditory.jpeg"),kinesthetic:load("kinesthetic.jpeg")}};
