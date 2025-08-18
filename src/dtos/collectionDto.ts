import { CollectionVisibility } from '@prisma/client';

export interface GetCollectionDto {
  collectionId: number;
  title: string;
  description: string | null;
  bookmarkCount: number;
  visibility: CollectionVisibility;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionDto {
  title: string;
  description?: string;
  visibility?: CollectionVisibility;
}

export interface BookmarkInCollectionDto {
  bookmarkId: number;
  message: string;
  createdAt: Date;
}

export interface RoomInCollectionDto {
  roomId: number;
  roomTitle: string;
  videoTitle: string;
  videoThumbnail: string;
  bookmarks: BookmarkInCollectionDto[];
}

export interface GetCollectionDetailDto {
  collectionId: number;
  title: string;
  description: string | null;
  bookmarkCount: number;
  visibility: CollectionVisibility;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  rooms: RoomInCollectionDto[];
}

export interface UpdateCollectionDto {
  title?: string;
  description?: string;
  visibility?: CollectionVisibility;
}

export interface ReorderCollectionsDto {
  collectionOrders: { collectionId: number; order: number }[];
}
