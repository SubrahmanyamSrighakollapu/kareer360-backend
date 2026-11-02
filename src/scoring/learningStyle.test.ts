import {describe,expect,it} from "vitest";
import {scoreLearningStyle} from "./learningStyle.js";
describe("learning style scoring",()=>{
 it("counts VAK responses and calculates workbook-equivalent percentages",()=>{const result=scoreLearningStyle([...Array(11).fill(1),...Array(12).fill(2),...Array(7).fill(3)]);expect(result.scores).toEqual([{key:"visual",label:"Visual",count:11,percent:36.67,rank:2},{key:"auditory",label:"Auditory",count:12,percent:40,rank:1},{key:"kinesthetic",label:"Kinesthetic",count:7,percent:23.33,rank:3}]);expect(result.dominant).toEqual(["auditory"])});
 it("shares the top rank when styles tie",()=>{const result=scoreLearningStyle([...Array(10).fill(1),...Array(10).fill(2),...Array(10).fill(3)]);expect(result.scores.every(score=>score.rank===1)).toBe(true);expect(result.dominant).toEqual(["visual","auditory","kinesthetic"])});
});
