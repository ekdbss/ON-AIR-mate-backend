-- AlterTable
ALTER TABLE `user_blocks` ADD COLUMN `customReason` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `user_block_reasons` (
    `user_block_reason_id` INTEGER NOT NULL AUTO_INCREMENT,
    `block_id` INTEGER NOT NULL,
    `reason` ENUM('SPAM', 'SPOIL', 'PROFANITY', 'HATE', 'ETC') NOT NULL,

    PRIMARY KEY (`user_block_reason_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_block_reasons` ADD CONSTRAINT `user_block_reasons_block_id_fkey` FOREIGN KEY (`block_id`) REFERENCES `user_blocks`(`block_id`) ON DELETE CASCADE ON UPDATE CASCADE;
