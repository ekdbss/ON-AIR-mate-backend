/*
  Warnings:

  - You are about to alter the column `video_id` on the `rooms` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - Added the required column `updated_at` to the `collections` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `rooms` DROP FOREIGN KEY `rooms_video_id_fkey`;

-- AlterTable
ALTER TABLE `bookmarks` ADD COLUMN `collection_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `collections` ADD COLUMN `cover_image` VARCHAR(500) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `room_participants` ADD COLUMN `last_joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `total_stay_time` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `rooms` MODIFY `video_id` VARCHAR(20) NULL;

-- CreateTable
CREATE TABLE `user_feedbacks` (
    `feedback_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_feedbacks_user_id_fkey`(`user_id`),
    PRIMARY KEY (`feedback_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `bookmarks_collection_id_fkey` ON `bookmarks`(`collection_id`);

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `youtube_videos`(`video_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`collection_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_feedbacks` ADD CONSTRAINT `user_feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
