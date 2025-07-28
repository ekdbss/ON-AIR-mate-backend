/*
  Warnings:

  - Added the required column `left_at` to the `room_participants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_id` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `room_participants` ADD COLUMN `left_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `rooms` ADD COLUMN `video_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `rooms_video_id_fkey` ON `rooms`(`video_id`);

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `youtube_videos`(`video_id`) ON DELETE CASCADE ON UPDATE CASCADE;
