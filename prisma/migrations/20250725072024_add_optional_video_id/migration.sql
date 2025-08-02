/*
  Warnings:

  - You are about to drop the column `current_participants` on the `rooms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `rooms` DROP COLUMN `current_participants`,
    ADD COLUMN `video_id` VARCHAR(20) NULL;

-- CreateIndex
CREATE INDEX `rooms_video_id_fkey` ON `rooms`(`video_id`);

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `youtube_videos`(`video_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
