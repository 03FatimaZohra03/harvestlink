import { z } from "zod";

export const createProduceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().min(1),
  quantityAvailable: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive number"),
  quantityUnit: z.string().min(1).max(20),
  pricePerUnit: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive number"),
  currency: z.string().min(3).max(3).default("INR"),
  locationText: z.string().min(1).max(200),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  harvestDate: z.string().datetime().optional().or(z.literal("")),
  availableUntil: z.string().datetime(),
  pickupNotes: z.string().max(500).optional(),
  imageUrls: z.array(z.string().url()).max(5).default([]),
});

export const updateProduceSchema = createProduceSchema.partial();

export type CreateProduceInput = z.infer<typeof createProduceSchema>;
export type UpdateProduceInput = z.infer<typeof updateProduceSchema>;
