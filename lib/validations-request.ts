import { z } from "zod";

export const createRequestSchema = z.object({
  produceId: z.string().min(1),
  quantityRequested: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive number"),
  proposedPricePerUnit: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive number"),
  currency: z.string().min(3).max(3).default("INR"),
  proposedPickupTime: z.string().datetime().optional().or(z.literal("")),
  pickupLocationText: z.string().max(200).optional(),
  pickupNotes: z.string().max(500).optional(),
  buyerMessage: z.string().max(1000).optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
