export type SharedCollectionAction = 'ACCEPT' | 'REJECT';

export class SharedCollectionResponseDto {
  sharedCollectionId!: number;
  originalCollectionId!: number;
  title!: string;
  fromUserId!: number;
  fromUserNickname!: string;
  bookmarkCount!: number;
  sharedAt!: Date;
}

export class SharedCollectionActionDto {
  action!: SharedCollectionAction;
}
