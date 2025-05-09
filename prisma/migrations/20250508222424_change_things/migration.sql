/*
  Warnings:

  - You are about to drop the column `product` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `Review` table. All the data in the column will be lost.
  - Changed the type of `product_id` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "product",
DROP COLUMN "user",
DROP COLUMN "product_id",
ADD COLUMN     "product_id" INTEGER NOT NULL;
