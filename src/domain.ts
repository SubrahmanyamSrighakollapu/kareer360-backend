export const VERSIONS = {
  assessment: "k360-2023-v1",
  questions: "mi80-2023-v1",
  scoring: "excel-parity-2023-v1",
  report: "report-2026-v1",
} as const;

export type StudentDetails = {
  fullName: string; dateOfBirth: string; educationLevel: string; institution?: string;
  profession: string; gender: "Male"|"Female"|"Non-binary"|"Prefer not to say"|"Other";
  city: string; country: string; email: string; contactNumber: string; consentConfirmed: boolean;
};
export type IntelligenceKey = "logical"|"musical"|"naturalist"|"verbal"|"interpersonal"|"kinesthetic"|"visual"|"intrapersonal";
export type Score = { key: string; label: string; raw: number; percent: number; rank: number };
export type RatedScore = { key: string; label: string; score: number; classification?: string };
export type CareerScore = { category: string; career: string; score: number; rank: number };
export type AssessmentResult = {
  multipleIntelligences: Score[]; mackenzieDomains: RatedScore[]; riasec: RatedScore[];
  careerRecommendations: CareerScore[]; versions: typeof VERSIONS;
};
export type LearningStyleKey = "visual"|"auditory"|"kinesthetic";
export type LearningStyleScore = {key:LearningStyleKey;label:string;count:number;percent:number;rank:number};
export type LearningStyleResult = {scores:LearningStyleScore[];dominant:LearningStyleKey[]};
