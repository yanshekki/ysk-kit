-- AlterTable
ALTER TABLE `Organization` ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL;

-- Drop existing per-user subscriptions (kit skeleton; no production data).
DELETE FROM `Subscription`;

-- DropForeignKey
ALTER TABLE `Subscription` DROP FOREIGN KEY `Subscription_userId_fkey`;

-- DropIndex
DROP INDEX `Subscription_userId_key` ON `Subscription`;

-- AlterTable
ALTER TABLE `Subscription` DROP COLUMN `userId`,
    DROP COLUMN `stripeCustomerId`,
    ADD COLUMN `organizationId` VARCHAR(191) NOT NULL,
    ADD COLUMN `seatCount` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX `Subscription_organizationId_key` ON `Subscription`(`organizationId`);

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
