/*
  Warnings:

  - You are about to drop the column `locationLat` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `locationLng` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `locationLat` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `locationLng` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "locationLat",
DROP COLUMN "locationLng";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "locationLat",
DROP COLUMN "locationLng";
