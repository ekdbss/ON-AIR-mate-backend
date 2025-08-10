export type MessageType = 'general' | 'system'; // 필요한 타입들 정의
export type chatMessageType = 'general' | 'collectionShare' | 'roomInvite'; // 필요한 타입들 정의

export interface SaveRoomMessageInput {
  roomId: number;
  userId: number;
  content: string;
  messageType: MessageType;
}

export interface RoomMessageDTO {
  messageId: number;
  userId: number;
  nickname: string;
  profileImage: string;
  content: string;
  messageType: MessageType;
  timestamp: Date;
}

export interface SendDirectMessageDTO {
  receiverId: number;
  content: string;
  type?: chatMessageType; // 등등 필요에 따라 추가
}

export interface DirectMessageDTO {
  messageId: number;
  senderId: number;
  receiverId: number;
  profileImage: string;
  content: string;
  messageType: chatMessageType;
  timestamp: Date;
}
