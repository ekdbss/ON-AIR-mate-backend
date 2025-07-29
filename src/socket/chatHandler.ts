import { Server, Socket } from 'socket.io';
import { joinRoom, enterRoom, leaveRoom, isParticipant, offlineUser } from './redisManager.js';
import {
  saveRoomMessage,
  saveDirectMessage,
  getOrCreateChatRoom,
  getChatRoom,
} from '../services/messageServices.js';
import { chatMessageType, MessageType } from '../dtos/messageDto.js';

export default function chatHandler(io: Server, socket: Socket) {
  const user = socket.data.user;
  const userId = user.id;
  console.log(`✅ 인증된 사용자 접속: ${user.nickname} (${userId}) , socketId: ${socket.id}`);
  /**
   * room 소캣 이벤트
   */

  //새로운 방 입장
  socket.on('joinRoom', async (data: { roomId: number; nickname: string }) => {
    const { roomId, nickname } = data;
    if (!roomId || !nickname) {
      socket.emit('error', { message: 'roomId and nickname required' });
      return;
    }
    //입장
    socket.join(roomId.toString());
    console.log('!!entered room:', roomId);

    //redis
    await joinRoom(roomId, Number(userId), socket.id);

    io.to(roomId.toString()).emit('userJoined', {
      user: nickname,
      count: io.sockets.adapter.rooms.get(roomId.toString())?.size || 0,
    });
    console.log(`${nickname}님이 ${roomId} 방에 입장`);
  });

  //기존 방 입장
  socket.on('enterRoom', async (data: { roomId: number; nickname: string }) => {
    const { roomId, nickname } = data;
    if (!nickname || !roomId) {
      socket.emit('error', { message: 'Required fields are missing.' });
      return;
    }

    const isIn = await isParticipant(Number(roomId), Number(userId));
    if (!isIn) {
      socket.emit('error', { message: 'Not participant in this room' });
      return;
    }
    //해당 소캣이 room에 join함
    socket.join(roomId.toString());
    console.log('!!entered room:', roomId);
    //redis
    await enterRoom(Number(userId), socket.id);
  });

  // 방 메시지 보내기
  socket.on(
    'sendRoomMessage',
    async (data: { roomId: number; nickname: string; content: string; messageType: string }) => {
      const { roomId, nickname, content, messageType } = data;
      if (!roomId || !nickname || !content || !messageType) {
        socket.emit('error', { message: 'Required fields are missing.' });
        return;
      }

      const isIn = await isParticipant(roomId, Number(userId));
      if (!isIn) {
        socket.emit('error', { message: 'Not participant in this room' });
        return;
      }

      //db 저장
      const message = await saveRoomMessage({
        roomId: roomId,
        userId: Number(userId),
        content,
        messageType: messageType as MessageType,
      });

      //메시지 전송
      io.to(roomId.toString()).emit('receiveRoomMessage', { data: message });
      console.log(`${message}`);
    },
  );

  //room 퇴장
  socket.on('leaveRoom', async (roomId: number) => {
    try {
      await leaveRoom(roomId, Number(userId));
      socket.leave(roomId.toString());
      io.to(roomId.toString()).emit('userLeft', { userId, socketId: socket.id });
    } catch (err) {
      console.error('leaveRoom error:', err); // 서버 로그 확인용
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });

  socket.on('disconnect', async () => {
    const userId = socket.data.user.id;
    await offlineUser(userId, socket.id);
  });

  //1:1 DM 방 입장
  socket.on('joinDM', async (receiverId: number) => {
    if (!receiverId) {
      socket.emit('error', { message: 'Required fields are missing.' });
      return;
    }

    const dmRoom = await getOrCreateChatRoom(userId, receiverId);
    const dmId = dmRoom.chatId;

    socket.join(dmId.toString());
    console.log('!!entered dm:', dmId);

    console.log(`${userId}님이 ${dmId} dm 방에 입장`);
  });

  // 1:1 DM 보내기
  socket.on(
    'sendDirectMessage',
    async (data: {
      receiverId: number;
      fromNickname: string;
      content: string;
      messageType: string;
    }) => {
      const { receiverId, fromNickname, content, messageType } = data;
      if (!receiverId || !content || !fromNickname || !messageType) {
        socket.emit('error', { message: 'Required fields are missing.' });
        return;
      }

      const dmRoom = await getChatRoom(userId, receiverId);
      const dmId = dmRoom.chatId;

      //DB 저장
      const validMessageTypes = ['general', 'collectionShare', 'roomInvite'];
      if (!validMessageTypes.includes(messageType)) {
        socket.emit('error', { message: 'Invalid message type' });
        return;
      }
      const message = await saveDirectMessage(userId, {
        receiverId,
        content,
        type: messageType as chatMessageType,
      });

      //전송
      socket
        .to(dmId.toString())
        .emit('receiveDirectMessage', { sender: fromNickname, message: message });
      console.log(`[DM] ${fromNickname} -> ${dmId}: ${content}`);
    },
  );

  //dm방 삭제 - 친구 해제
  socket.on('unFriend', async (data: { userId1: number; userId2: number }) => {
    try {
      const { userId1, userId2 } = data;
      if (!userId1 || !userId2) {
        socket.emit('error', { message: 'Required fields are missing.' });
        return;
      }
      const dmRoom = await getChatRoom(userId1, userId2);
      const dmId = dmRoom.chatId;
      socket.leave(dmId.toString());
      console.log(`친구 방 삭제 - ${dmId} 삭제 : ${userId1}, ${userId2}`);
    } catch (err) {
      console.error('noFriend error:', err); // 서버 로그 확인용
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });
}
