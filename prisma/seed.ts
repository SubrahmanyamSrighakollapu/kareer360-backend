import { PrismaClient } from "@prisma/client";
import { questions } from "../src/data/questions.js";
import { VERSIONS } from "../src/domain.js";
const prisma=new PrismaClient();
const main=async()=>{const d=await prisma.assessmentDefinition.upsert({where:{version:VERSIONS.assessment},update:{},create:{version:VERSIONS.assessment,title:"Kareer360 Psychometric Assessment"}});for(const q of questions)await prisma.question.upsert({where:{id:q.id},update:{statement:q.statement,ordinal:q.ordinal},create:{...q,questionSetVersion:VERSIONS.questions,definitionId:d.id}})};
main().finally(()=>prisma.$disconnect());
