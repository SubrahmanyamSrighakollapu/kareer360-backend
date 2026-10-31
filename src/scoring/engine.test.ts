import { describe,expect,it } from "vitest";
import { scoreAssessment } from "./engine.js";
describe("workbook-equivalent scoring",()=>{
 it("matches the sample answer snapshot for core scores",()=>{const sample=[4,1,3,3,1,2,2,3,3,3,4,2,4,1,2,2,3,2,3,3,3,2,4,2,2,3,3,4,4,1,2,1,1,1,2,3,2,4,2,4,2,4,3,3,4,3,1,3,3,1,2,2,2,1,3,3,1,4,3,2,3,1,3,3,1,2,4,3,3,4,3,3,3,2,2,3,4,4,4,4];const r=scoreAssessment(sample);expect(r.multipleIntelligences.map(x=>x.raw)).toEqual([20,27,29,24,27,27,30,26]);expect(r.mackenzieDomains.map(x=>x.score)).toEqual([36.19,37.14,26.67]);expect(r.riasec.map(x=>x.score)).toEqual([7,6.44,7.08,7,6.17,5.75])});
 it("rejects incomplete or out-of-range input",()=>{expect(()=>scoreAssessment(Array(79).fill(2))).toThrow();expect(()=>scoreAssessment(Array(80).fill(5))).toThrow()});
 it("uses competition ranks for ties",()=>{const r=scoreAssessment(Array(80).fill(2));expect(r.multipleIntelligences.every(x=>x.rank===1)).toBe(true)});
});
