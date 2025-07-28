export interface Participant {
  userId: number;
  nickname: string;
}

export interface Room {
  roomId: number;
  roomName: string;
  hostId: number;
  participants: Participant[];
  isPublic?: boolean;
  maxParticipants?: number;
}

export interface createNewRoom {
  roomName: string;
  hostId: number;
  isPublic?: boolean;
  maxParticipants?: number;
  videoId: string;
}
