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
<<<<<<< HEAD

export class SharedCollectionActionDto {
  action!: SharedCollectionAction;
}
=======
>>>>>>> e144817243cd7f05bcb35bd1c486c7cdfae22c0f
