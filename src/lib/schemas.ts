/** Esquemas zod compartilhados entre cliente, Server Actions e fila offline. */
import { z } from "zod";

const uuid = z.uuid();
const cents = z.number().int().min(0).max(2_000_000_000);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v ? v : undefined))
    .optional();

export const sizeGridSchema = z.record(z.string().min(1).max(8), z.number().int().min(0).max(1_000_000));

export const clientCreateSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1).max(120),
  phone: optText(30),
  preferredLocale: z.enum(["es", "pt-BR"]).default("pt-BR"),
  notes: optText(500),
  /** serviço de costume (cliente recorrente) */
  usualReference: optText(80),
  usualUnitPriceCents: cents.min(1).optional(),
});

export const workerCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: optText(30),
  isEmployee: z.boolean().default(false),
  docType: z.enum(["cpf", "rnm"]).optional(),
  docNumber: optText(30),
});

export const batchCreateSchema = z
  .object({
    clientId: uuid.optional(),
    newClientName: optText(120),
    reference: optText(80),
    quantity: z.number().int().min(1).max(1_000_000),
    sizeGrid: sizeGridSchema.optional(),
    color: optText(60),
    unitPriceCents: cents.min(1),
    dueDate: isoDate.optional(),
    suppliesBy: z.enum(["client", "workshop"]).default("client"),
    suppliesNote: optText(300),
    photoIds: z.array(uuid).max(5).default([]),
    operations: z
      .array(
        z.object({
          machine: z.enum(["recta", "overlock", "collareta", "interlock", "other"]),
          label: optText(40),
          pieceRateCents: cents.min(1),
        }),
      )
      .max(10)
      .default([]),
  })
  .superRefine((v, ctx) => {
    if (v.sizeGrid && Object.keys(v.sizeGrid).length > 0) {
      const sum = Object.values(v.sizeGrid).reduce((a, b) => a + b, 0);
      if (sum !== v.quantity) {
        ctx.addIssue({ code: "custom", path: ["sizeGrid"], message: `grid_mismatch:${sum}:${v.quantity}` });
      }
    }
  });

export const productionLogSchema = z.object({
  workerId: uuid,
  batchId: uuid,
  operationId: uuid.optional(),
  machine: z.enum(["recta", "overlock", "collareta", "interlock", "other"]).optional(),
  pieceRateCents: cents.optional(),
  pieces: z.number().int().min(1).max(100_000),
  hours: z.number().min(0).max(24).optional(),
  workDate: isoDate,
});

export const advanceSchema = z.object({
  workerId: uuid,
  amountCents: cents.min(1),
  givenOn: isoDate,
  reason: optText(200),
});

export const paymentSchema = z.object({
  receivableId: uuid,
  amountCents: cents.min(1),
  paidOn: isoDate,
  method: z.enum(["pix", "cash", "other"]).default("pix"),
  note: optText(200),
});

export const deliverySchema = z
  .object({
    batchId: uuid,
    quantity: z.number().int().min(1).max(1_000_000),
    sizeGrid: sizeGridSchema.optional(),
    discountCents: cents.default(0),
    note: optText(500),
    photoIds: z.array(uuid).max(5).default([]),
    dueOn: isoDate.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.sizeGrid && Object.keys(v.sizeGrid).length > 0) {
      const sum = Object.values(v.sizeGrid).reduce((a, b) => a + b, 0);
      if (sum !== v.quantity) {
        ctx.addIssue({ code: "custom", path: ["sizeGrid"], message: `grid_mismatch:${sum}:${v.quantity}` });
      }
    }
  });

export const workshopCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  district: optText(80),
  city: optText(80),
  machineCount: z.number().int().min(1).max(200),
  pixKeyType: z.enum(["evp", "phone", "email", "cpf", "cnpj"]).optional(),
  pixKey: optText(77),
  pixMerchantName: optText(25),
  pixCity: optText(15),
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
  locale: z.enum(["es", "pt-BR"]),
});

export const MUTATION_TYPES = [
  "batch.create",
  "client.create",
  "worker.create",
  "production.log",
  "advance.create",
  "payment.create",
] as const;
export type MutationType = (typeof MUTATION_TYPES)[number];

export const syncMutationSchema = z.object({
  clientMutationId: uuid,
  type: z.enum(MUTATION_TYPES),
  payload: z.unknown(),
  clientCreatedAt: z.string().optional(),
});

export const syncRequestSchema = z.object({
  mutations: z.array(syncMutationSchema).min(1).max(50),
});

export type SyncMutation = z.infer<typeof syncMutationSchema>;
export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export type ProductionLogInput = z.infer<typeof productionLogSchema>;
export type AdvanceInput = z.infer<typeof advanceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;
