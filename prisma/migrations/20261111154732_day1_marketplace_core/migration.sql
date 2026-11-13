-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SELLER', 'BUYER', 'LOGISTICS');

-- CreateEnum
CREATE TYPE "LogisticsRole" AS ENUM ('TRANSPORTER', 'STORAGE_PROVIDER');

-- CreateEnum
CREATE TYPE "ProduceStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "logisticsRole" "LogisticsRole",
    "phone" TEXT,
    "locationText" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "businessName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produce" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantityAvailable" DECIMAL(10,2) NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "locationText" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "harvestDate" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3) NOT NULL,
    "status" "ProduceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "pickupNotes" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduceRequest" (
    "id" TEXT NOT NULL,
    "produceId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantityRequested" DECIMAL(10,2) NOT NULL,
    "proposedPricePerUnit" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "proposedPickupTime" TIMESTAMP(3),
    "pickupLocationText" TEXT,
    "pickupNotes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "buyerMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProduceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pickup" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "transporterId" TEXT,
    "scheduledPickupTime" TIMESTAMP(3) NOT NULL,
    "actualPickupTime" TIMESTAMP(3),
    "deliveredTime" TIMESTAMP(3),
    "pickupLocationText" TEXT NOT NULL,
    "deliveryLocationText" TEXT NOT NULL,
    "status" "PickupStatus" NOT NULL DEFAULT 'SCHEDULED',
    "transporterNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pickup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_accountType_idx" ON "User"("accountType");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- CreateIndex
CREATE INDEX "User_pincode_idx" ON "User"("pincode");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Produce_sellerId_idx" ON "Produce"("sellerId");

-- CreateIndex
CREATE INDEX "Produce_categoryId_idx" ON "Produce"("categoryId");

-- CreateIndex
CREATE INDEX "Produce_status_idx" ON "Produce"("status");

-- CreateIndex
CREATE INDEX "Produce_availableUntil_idx" ON "Produce"("availableUntil");

-- CreateIndex
CREATE INDEX "Produce_city_idx" ON "Produce"("city");

-- CreateIndex
CREATE INDEX "Produce_pincode_idx" ON "Produce"("pincode");

-- CreateIndex
CREATE INDEX "ProduceRequest_produceId_idx" ON "ProduceRequest"("produceId");

-- CreateIndex
CREATE INDEX "ProduceRequest_buyerId_idx" ON "ProduceRequest"("buyerId");

-- CreateIndex
CREATE INDEX "ProduceRequest_status_idx" ON "ProduceRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Pickup_requestId_key" ON "Pickup"("requestId");

-- CreateIndex
CREATE INDEX "Pickup_transporterId_idx" ON "Pickup"("transporterId");

-- CreateIndex
CREATE INDEX "Pickup_status_idx" ON "Pickup"("status");

-- AddForeignKey
ALTER TABLE "Produce" ADD CONSTRAINT "Produce_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produce" ADD CONSTRAINT "Produce_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduceRequest" ADD CONSTRAINT "ProduceRequest_produceId_fkey" FOREIGN KEY ("produceId") REFERENCES "Produce"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduceRequest" ADD CONSTRAINT "ProduceRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProduceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
