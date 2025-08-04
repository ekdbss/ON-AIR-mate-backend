export interface UpdateRoomSettingDto {
  maxParticipants?: number;
  isPrivate?: boolean;
  autoArchiving?: boolean;
  invitePermission?: string;
}
