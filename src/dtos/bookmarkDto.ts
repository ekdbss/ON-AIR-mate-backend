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
  isPublic: boolean;
  startFrom: 'BOOKMARK' | 'BEGINNING';
}
