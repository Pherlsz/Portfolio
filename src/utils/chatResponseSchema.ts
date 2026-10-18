import { z } from 'zod';

export const ChatSourceSchema = z.enum(['ai', 'local']);

export type ChatSource = z.infer<typeof ChatSourceSchema>;

const ChatActionSchema = z.object({
  label: z.string(),
  type: z.enum(['navigate', 'export_cv']),
  value: z.string()
});

export const ChatResponseSchema = z.object({
  reply: z.string(),
  source: ChatSourceSchema,
  actions: z.array(ChatActionSchema).optional(),
  followUps: z.array(z.string()).optional(),
  blockedByZod: z.boolean().optional(),
  error: z.string().optional()
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
