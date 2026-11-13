// Prisma returns Decimal for our Decimal fields. We need to convert to strings
// for JSON serialization (otherwise the API returns {} empty objects).

export function serializeProduce(p: any) {
  return {
    id: p.id,
    sellerId: p.sellerId,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name } : undefined,
    seller: p.seller ? { id: p.seller.id, name: p.seller.name, businessName: p.seller.businessName, city: p.seller.city, phone: p.seller.phone } : undefined,
    name: p.name,
    description: p.description,
    quantityAvailable: p.quantityAvailable?.toString() ?? null,
    quantityUnit: p.quantityUnit,
    pricePerUnit: p.pricePerUnit?.toString() ?? null,
    currency: p.currency,
    locationText: p.locationText,
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    harvestDate: p.harvestDate?.toISOString() ?? null,
    availableUntil: p.availableUntil?.toISOString() ?? null,
    status: p.status,
    pickupNotes: p.pickupNotes,
    imageUrls: p.imageUrls,
    createdAt: p.createdAt?.toISOString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  };
}
