import {scoreLearningStyle} from "../scoring/learningStyle.js";
import {generateLearningStylePdf} from "../report/learningStyleGenerator.js";
const result=scoreLearningStyle(Array.from({length:30},(_,i)=>(i%3)+1));
const output=await generateLearningStylePdf({student:{fullName:"Sample Student",dateOfBirth:"2010-01-15",educationLevel:"Class 10",institution:"Kareer360 Academy",profession:"Student",gender:"Prefer not to say",city:"Hyderabad",country:"India",email:"student@example.com",contactNumber:"9876543210",consentConfirmed:true},result,assessmentDate:new Date().toISOString()},"learning-sample");
console.log(output);
