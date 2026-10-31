import crypto from "node:crypto";
import type { AssessmentResult, StudentDetails } from "./domain.js";
export type Session={id:string;token:string;student:StudentDetails;answers:Record<string,number>;status:"IN_PROGRESS"|"SUBMITTED";result?:AssessmentResult;reportId?:string;idempotencyKey?:string;createdAt:string};
export type Report={id:string;token:string;sessionId:string;status:"GENERATING"|"READY"|"FAILED";path?:string;error?:string};
const sessions=new Map<string,Session>(), reports=new Map<string,Report>();
const randomToken=()=>crypto.randomBytes(24).toString("base64url");
const safeEqual=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)};
export const store={
 create(student:StudentDetails){const s:Session={id:crypto.randomUUID(),token:randomToken(),student,answers:{},status:"IN_PROGRESS",createdAt:new Date().toISOString()};sessions.set(s.id,s);return s},
 session(id:string,t?:string){const s=sessions.get(id);return s&&safeEqual(s.token,t??"")?s:undefined},
 report(id:string,t?:string){const r=reports.get(id);return r&&safeEqual(r.token,t??"")?r:undefined},
 createReport(sessionId:string){const r:Report={id:crypto.randomUUID(),token:randomToken(),sessionId,status:"GENERATING"};reports.set(r.id,r);return r},
 unsafeSession(id:string){return sessions.get(id)},
 unsafeReport(id:string){return reports.get(id)}
};


