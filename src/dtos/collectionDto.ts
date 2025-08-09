export enum CollectionVisibility {
  PRIVATE = 'private',
  FRIENDS = 'friends',
  PUBLIC = 'public',
}

export interface CreateCollectionDto {
  title: string;
  description?: string;
  visibility: CollectionVisibility;
}
