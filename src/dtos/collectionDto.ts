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
