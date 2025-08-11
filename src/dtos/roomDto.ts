export interface Participant {
  userId: number;
  nickname: string;
}

export interface Room {
  roomId: number;
  roomName: string;
  hostId: number;
  participants: Participant[];
  isPrivate?: boolean;
  maxParticipants?: number;
}

export interface createNewRoom {
  roomName: string;
  hostId: number;
  isPrivate?: boolean;
  maxParticipants?: number;
  videoId: string;
}
