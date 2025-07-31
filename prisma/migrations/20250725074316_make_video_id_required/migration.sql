/*
  Warnings:

  - Made the column `video_id` on table `rooms` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `rooms` DROP FOREIGN KEY `rooms_video_id_fkey`;

-- AlterTable
ALTER TABLE `rooms` MODIFY `video_id` VARCHAR(20) NOT NULL;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `youtube_videos`(`video_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
