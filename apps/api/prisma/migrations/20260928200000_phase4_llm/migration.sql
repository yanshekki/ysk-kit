-- CreateTable
CREATE TABLE `LlmUsage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `promptTokens` INTEGER NOT NULL,
    `completionTokens` INTEGER NOT NULL,
    `totalTokens` INTEGER NOT NULL,
    `costMicros` INTEGER NULL,
    `requestId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LlmUsage_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LlmUsage` ADD CONSTRAINT `LlmUsage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
