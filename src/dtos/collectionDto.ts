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
  videoTitle: string;
  videoThumbnail: string;
  roomTitle: string;
  message: string;
  createdAt: Date;
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
  bookmarks: BookmarkInCollectionDto[];
}
