import { z } from "zod";
export const studentSchema=z.object({
 fullName:z.string().trim().min(2).max(100), dateOfBirth:z.string().date(), educationLevel:z.string().trim().min(1).max(80),
 institution:z.string().trim().max(150).optional().or(z.literal("")), city:z.string().trim().min(2).max(100),
 email:z.string().email().optional().or(z.literal("")), contactNumber:z.string().regex(/^[+\d ()-]{7,20}$/).optional().or(z.literal("")),
 consentConfirmed:z.literal(true)
});
export const answersSchema=z.object({answers:z.array(z.object({questionId:z.string().regex(/^q([1-9]|[1-7][0-9]|80)$/),value:z.number().int().min(1).max(4)})).max(80)});
export const submitSchema=z.object({idempotencyKey:z.string().min(12).max(100)});
