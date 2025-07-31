export interface RoomInfoResponseDto {
  roomId: number;
  roomTitle: string;
  videoId: string;
  videoTitle: string;
  videoThumbnail: string;
  hostNickname: string;
  hostProfileImage: string;
  hostPopularity: number;
  currentParticipants: number;
  maxParticipants: number;
  duration: string;
  isPrivate: boolean;
  isActive: boolean;
  autoArchiving: boolean;
  invitePermission: 'HOST_ONLY' | string;
  createdAt: string;
}
