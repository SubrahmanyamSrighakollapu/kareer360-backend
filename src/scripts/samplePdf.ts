import { scoreAssessment } from "../scoring/engine.js";
import { generateReferencePdf } from "../report/referenceGenerator.js";
const result=scoreAssessment(Array.from({length:80},(_,i)=>(i%4)+1));
const output=await generateReferencePdf({student:{fullName:"Sample Student",dateOfBirth:"2010-01-15",educationLevel:"Class 10",institution:"Kareer360 Academy",profession:"Student",gender:"Prefer not to say",city:"Hyderabad",country:"India",email:"student@example.com",contactNumber:"9876543210",consentConfirmed:true},result,assessmentDate:new Date().toISOString()},"sample");
console.log(output);
