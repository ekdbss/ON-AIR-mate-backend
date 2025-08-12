export interface CreateBookmarkDto {
  roomId: number;
  message: string;
}

export interface MoveBookmarkDto {
  collectionId: number;
}

export interface CreateRoomFromBookmarkDto {
  roomTitle: string;
  maxParticipants: number;
  isPrivate: boolean;
  startFrom: 'BOOKMARK' | 'BEGINNING';
}
