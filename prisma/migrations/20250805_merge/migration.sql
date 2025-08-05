-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `loginId` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(30) NOT NULL,
    `profile_image` VARCHAR(500) NULL,
    `popularity` INTEGER NOT NULL DEFAULT 0,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `refresh_token` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_loginId_key`(`loginId`),
    UNIQUE INDEX `users_nickname_key`(`nickname`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_agreements` (
    `agreement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `service_terms` BOOLEAN NOT NULL DEFAULT false,
    `privacy_collection` BOOLEAN NOT NULL DEFAULT false,
    `privacy_policy` BOOLEAN NOT NULL DEFAULT false,
    `marketing_consent` BOOLEAN NOT NULL DEFAULT false,
    `event_promotion` BOOLEAN NOT NULL DEFAULT false,
    `service_notification` BOOLEAN NOT NULL DEFAULT true,
    `advertising_notification` BOOLEAN NOT NULL DEFAULT false,
    `night_notification` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `user_agreements_user_id_key`(`user_id`),
    PRIMARY KEY (`agreement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friendship` (
    `friendship_id` INTEGER NOT NULL AUTO_INCREMENT,
    `requested_by` INTEGER NOT NULL,
    `requested_to` INTEGER NOT NULL,
    `is_accepted` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accepted_at` DATETIME(3) NULL,

    INDEX `idx_requested_by_status`(`requested_by`, `status`),
    INDEX `friendship_requested_to_fkey`(`requested_to`),
    UNIQUE INDEX `friendship_requested_by_requested_to_key`(`requested_by`, `requested_to`),
    PRIMARY KEY (`friendship_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_blocks` (
    `block_id` INTEGER NOT NULL AUTO_INCREMENT,
    `blocker_user_id` INTEGER NOT NULL,
    `blocked_user_id` INTEGER NOT NULL,
    `blocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `user_blocks_blocked_user_id_fkey`(`blocked_user_id`),
    UNIQUE INDEX `user_blocks_blocker_user_id_blocked_user_id_key`(`blocker_user_id`, `blocked_user_id`),
    PRIMARY KEY (`block_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `room_id` INTEGER NOT NULL AUTO_INCREMENT,
    `host_id` INTEGER NOT NULL,
    `room_name` VARCHAR(100) NOT NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `max_participants` INTEGER NOT NULL DEFAULT 6,
    `current_participants` INTEGER NOT NULL DEFAULT 1,
    `popularity` INTEGER NOT NULL DEFAULT 0,
    `auto_archive` BOOLEAN NOT NULL DEFAULT true,
    `invite_auth` ENUM('all', 'host') NOT NULL DEFAULT 'all',
    `watched_30s` BOOLEAN NOT NULL DEFAULT false,
    `startType` ENUM('BOOKMARK', 'BEGINNING') NOT NULL DEFAULT 'BEGINNING',
    `startTime` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `video_id` VARCHAR(20) NOT NULL,

    INDEX `rooms_host_id_fkey`(`host_id`),
    INDEX `rooms_video_id_fkey`(`video_id`),
    PRIMARY KEY (`room_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_participants` (
    `participant_id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `role` ENUM('host', 'participant') NOT NULL DEFAULT 'participant',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `left_at` DATETIME(3) NULL,
    `last_joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total_stay_time` INTEGER NOT NULL DEFAULT 0,

    INDEX `room_participants_user_id_fkey`(`user_id`),
    UNIQUE INDEX `room_participants_room_id_user_id_key`(`room_id`, `user_id`),
    PRIMARY KEY (`participant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_messages` (
    `message_id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('general', 'system') NOT NULL DEFAULT 'general',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `room_messages_room_id_fkey`(`room_id`),
    INDEX `room_messages_user_id_fkey`(`user_id`),
    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_chats` (
    `chat_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user1_id` INTEGER NOT NULL,
    `user2_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_chats_user2_id_fkey`(`user2_id`),
    UNIQUE INDEX `user_chats_user1_id_user2_id_key`(`user1_id`, `user2_id`),
    PRIMARY KEY (`chat_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_chat_messages` (
    `message_id` INTEGER NOT NULL AUTO_INCREMENT,
    `chat_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `content` TEXT NULL,
    `type` ENUM('general', 'collectionShare', 'roomInvite') NOT NULL DEFAULT 'general',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_chat_type`(`chat_id`, `type`),
    INDEX `user_chat_messages_user_id_fkey`(`user_id`),
    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarks` (
    `bookmark_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `room_id` INTEGER NOT NULL,
    `title` VARCHAR(50) NULL,
    `content` TEXT NULL,
    `timeline` INTEGER NULL DEFAULT 0,
    `original_bookmark_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `collection_id` INTEGER NULL,

    INDEX `bookmarks_original_bookmark_id_fkey`(`original_bookmark_id`),
    INDEX `bookmarks_room_id_fkey`(`room_id`),
    INDEX `bookmarks_user_id_fkey`(`user_id`),
    INDEX `bookmarks_collection_id_fkey`(`collection_id`),
    PRIMARY KEY (`bookmark_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collections` (
    `collection_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` VARCHAR(100) NULL,
    `visibility` ENUM('private', 'friends', 'public') NOT NULL DEFAULT 'public',
    `bookmark_count` INTEGER NOT NULL DEFAULT 0,
    `is_liked` BOOLEAN NOT NULL DEFAULT false,
    `original_collection_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cover_image` VARCHAR(500) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `collections_original_collection_id_fkey`(`original_collection_id`),
    INDEX `collections_user_id_fkey`(`user_id`),
    PRIMARY KEY (`collection_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shared_collections` (
    `share_id` INTEGER NOT NULL AUTO_INCREMENT,
    `shared_to_user_id` INTEGER NOT NULL,
    `collection_id` INTEGER NOT NULL,
    `shared_in_chat_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `shared_collections_collection_id_fkey`(`collection_id`),
    INDEX `shared_collections_shared_in_chat_id_fkey`(`shared_in_chat_id`),
    INDEX `shared_collections_shared_to_user_id_fkey`(`shared_to_user_id`),
    PRIMARY KEY (`share_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_user_id` INTEGER NULL,
    `to_user_id` INTEGER NOT NULL,
    `title` VARCHAR(150) NULL,
    `type` ENUM('roomInvite', 'collectionShare', 'friendRequest', 'popularityUp') NOT NULL,
    `status` ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_to_user_created`(`to_user_id`, `created_at`),
    INDEX `notifications_from_user_id_fkey`(`from_user_id`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_recommendations` (
    `recommendation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `recommender_id` INTEGER NOT NULL,
    `recommended_user_id` INTEGER NOT NULL,
    `recommendation_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `daily_recommendations_recommended_user_id_fkey`(`recommended_user_id`),
    UNIQUE INDEX `daily_recommendations_recommender_id_recommended_user_id_rec_key`(`recommender_id`, `recommended_user_id`, `recommendation_date`),
    PRIMARY KEY (`recommendation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_history` (
    `history_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `search_keyword` VARCHAR(100) NOT NULL,
    `searched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_user_searched`(`user_id`, `searched_at`),
    PRIMARY KEY (`history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `youtube_videos` (
    `video_id` VARCHAR(20) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `thumbnail` VARCHAR(500) NULL,
    `channel_icon` VARCHAR(500) NULL,
    `channel_name` VARCHAR(100) NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `duration` VARCHAR(20) NULL,
    `uploaded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`video_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_feedbacks` (
    `feedback_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_feedbacks_user_id_fkey`(`user_id`),
    PRIMARY KEY (`feedback_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_agreements` ADD CONSTRAINT `user_agreements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendship` ADD CONSTRAINT `friendship_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendship` ADD CONSTRAINT `friendship_requested_to_fkey` FOREIGN KEY (`requested_to`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blocked_user_id_fkey` FOREIGN KEY (`blocked_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blocker_user_id_fkey` FOREIGN KEY (`blocker_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_host_id_fkey` FOREIGN KEY (`host_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `youtube_videos`(`video_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_participants` ADD CONSTRAINT `room_participants_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_participants` ADD CONSTRAINT `room_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_messages` ADD CONSTRAINT `room_messages_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_messages` ADD CONSTRAINT `room_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_chats` ADD CONSTRAINT `user_chats_user1_id_fkey` FOREIGN KEY (`user1_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_chats` ADD CONSTRAINT `user_chats_user2_id_fkey` FOREIGN KEY (`user2_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_chat_messages` ADD CONSTRAINT `user_chat_messages_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `user_chats`(`chat_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_chat_messages` ADD CONSTRAINT `user_chat_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`collection_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_original_bookmark_id_fkey` FOREIGN KEY (`original_bookmark_id`) REFERENCES `bookmarks`(`bookmark_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collections` ADD CONSTRAINT `collections_original_collection_id_fkey` FOREIGN KEY (`original_collection_id`) REFERENCES `collections`(`collection_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collections` ADD CONSTRAINT `collections_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_collections` ADD CONSTRAINT `shared_collections_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`collection_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_collections` ADD CONSTRAINT `shared_collections_shared_in_chat_id_fkey` FOREIGN KEY (`shared_in_chat_id`) REFERENCES `user_chats`(`chat_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_collections` ADD CONSTRAINT `shared_collections_shared_to_user_id_fkey` FOREIGN KEY (`shared_to_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_to_user_id_fkey` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_recommendations` ADD CONSTRAINT `daily_recommendations_recommended_user_id_fkey` FOREIGN KEY (`recommended_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_recommendations` ADD CONSTRAINT `daily_recommendations_recommender_id_fkey` FOREIGN KEY (`recommender_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_history` ADD CONSTRAINT `search_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_feedbacks` ADD CONSTRAINT `user_feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

