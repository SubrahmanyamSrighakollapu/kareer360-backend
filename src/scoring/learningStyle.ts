import type { LearningStyleResult, LearningStyleScore, LearningStyleKey } from "../domain.js";

const styles: Array<{key:LearningStyleKey;label:string;value:number}> = [
  {key:"visual",label:"Visual",value:1},
  {key:"auditory",label:"Auditory",value:2},
  {key:"kinesthetic",label:"Kinesthetic",value:3},
];

export function scoreLearningStyle(answers:number[]):LearningStyleResult {
  if(answers.length!==30||answers.some(value=>!Number.isInteger(value)||value<1||value>3)) throw new Error("Exactly 30 answers valued 1–3 are required");
  const counts=styles.map(style=>answers.filter(value=>value===style.value).length);
  const sorted=[...counts].sort((a,b)=>b-a);
  const scores:LearningStyleScore[]=styles.map((style,index)=>({key:style.key,label:style.label,count:counts[index],percent:Number((counts[index]/30*100).toFixed(2)),rank:sorted.indexOf(counts[index])+1}));
  const best=Math.max(...counts);
  return {scores,dominant:scores.filter(score=>score.count===best).map(score=>score.key)};
}
