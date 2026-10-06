-- CreateTable
CREATE TABLE `ProcessedWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventCreatedAt` DATETIME(3) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProcessedWebhookEvent_provider_eventId_key`(`provider`, `eventId`),
    INDEX `ProcessedWebhookEvent_provider_organizationId_eventCreatedAt_idx`(`provider`, `organizationId`, `eventCreatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
