import { AssessmentResult, IntelligenceKey, VERSIONS } from "../domain.js";
import { careerRules, Facets } from "./careerRules.js";

const mappings: Record<IntelligenceKey, number[]> = {
 logical:[5,10,11,17,22,33,36,47,57,62], musical:[2,4,13,18,28,34,45,59,72,74],
 naturalist:[20,21,27,32,42,44,46,54,79,80], verbal:[6,8,9,14,25,35,37,58,60,68],
 interpersonal:[19,30,40,50,53,66,70,71,73,78], kinesthetic:[3,7,15,24,38,43,49,52,55,61],
 visual:[23,26,29,41,51,56,67,69,75,76], intrapersonal:[1,12,16,31,39,48,63,64,65,77]
};
const labels: Record<IntelligenceKey,string> = {logical:"Logical–Mathematical",musical:"Musical",naturalist:"Naturalist",verbal:"Verbal–Linguistic",interpersonal:"Interpersonal",kinesthetic:"Bodily–Kinesthetic",visual:"Spatial–Visual",intrapersonal:"Intrapersonal"};
const sum = (a:number[], ids:number[]) => ids.reduce((n,id)=>n+a[id-1],0);
const round=(n:number,d=2)=>Number(n.toFixed(d));
const cls=(n:number)=>n>=8?"High dominant":n>=6?"Dominant":n>=4?"Average dominant":"Less dominant";

function facets(a:number[]):Facets {
 const s=(ids:number[])=>sum(a,ids), norm=(ids:number[],max:number)=>s(ids)/max*10;
 return {
  logic1:norm([5,17,22,36,3,16,30,37],32), logic2:norm([33,47,57,62],16), logic3:norm([11,9,23,38],16),
  music1:norm([74],4), music2:norm([2,4,13,18,28,34,45,59,72,8,15],44),
  nature1:norm([20,27,54,80,26,75],24), nature2:norm([20,21,32,42,44,46,54,79],32), nature3:norm([21],4),
  verbal1:norm([24,43,52,2,29,67],24), verbal2:norm([6,8,9,25,35,37,58,60,68,14],40),
  inter1:norm([19,53,70,78,6,7,14,20,37,46,60],44), inter2:norm([30,40,50,66,71,73,19,27,39],36),
  kinesthetic1:norm([24,43,52,2,29,67],24), kinesthetic2:norm([3,7,15,38,49,55,61,27,73,80],40),
  visual1:norm([26,51,56,75,42,43],24), visual2:norm([23,29,41,67,69,76,24],28),
  intra1:norm([16,48,5,21,33,36,52,55],32), intra2:(s([1,12,31,39,63,64,65,77])-a[16]+s([18,45,58,70,78]))/52*10
 };
}

export function scoreAssessment(answers: number[]): AssessmentResult {
 if(answers.length!==80 || answers.some(v=>!Number.isInteger(v)||v<1||v>4)) throw new Error("Exactly 80 answers valued 1–4 are required");
 const raw=Object.fromEntries(Object.entries(mappings).map(([k,ids])=>[k,sum(answers,ids)])) as Record<IntelligenceKey,number>;
 const total=Object.values(raw).reduce((a,b)=>a+b,0);
 const sorted=Object.values(raw).slice().sort((a,b)=>b-a);
 const multipleIntelligences=(Object.keys(mappings) as IntelligenceKey[]).map(key=>({key,label:labels[key],raw:raw[key],percent:round(raw[key]/total*100),rank:sorted.indexOf(raw[key])+1}));
 const pct=(k:IntelligenceKey)=>raw[k]/total*100;
 const mackenzieDomains=[
  {key:"analytical",label:"Analytical",score:round(pct("logical")+pct("musical")+pct("naturalist"))},
  {key:"interactive",label:"Interactive",score:round(pct("verbal")+pct("interpersonal")+pct("kinesthetic"))},
  {key:"introspective",label:"Introspective",score:round(pct("visual")+pct("intrapersonal"))}
 ];
 const riasecBase:[string,string,number][]=[
  ["realistic","Realistic",(raw.kinesthetic+raw.naturalist)/80*10],
  ["investigative","Investigative",(raw.logical+raw.kinesthetic+raw.visual+raw.intrapersonal)/160*10],
  ["artistic","Artistic",(raw.visual+raw.intrapersonal+raw.naturalist)/120*10],
  ["social","Social",(raw.interpersonal+raw.naturalist)/80*10],
  ["enterprising","Enterprising",(raw.logical+raw.kinesthetic+raw.interpersonal)/120*10],
  ["conventional","Conventional",(raw.logical+raw.intrapersonal)/80*10]
 ];
 const riasec=riasecBase.map(([key,label,score])=>({key,label,score:round(score),classification:cls(score)}));
 const f=facets(answers);
 const careerUnranked=careerRules.map(r=>({category:r.category,career:r.career,score:round(Object.entries(r.weights).reduce((n,[k,w])=>n+(f[k]??0)*w,0))}));
 const careerSorted=careerUnranked.slice().sort((a,b)=>b.score-a.score);
 const careerRecommendations=careerUnranked.map(x=>({...x,rank:careerSorted.findIndex(y=>y.career===x.career)+1})).sort((a,b)=>a.rank-b.rank);
 return {multipleIntelligences,mackenzieDomains,riasec,careerRecommendations,versions:VERSIONS};
}


