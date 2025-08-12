import { Server, Socket } from 'socket.io';
import { joinRoom, enterRoom, leaveRoom, isParticipant, offlineUser } from './redisManager.js';
import {
  saveRoomMessage,
  saveDirectMessage,
  getOrCreateChatRoom,
  getChatRoom,
} from '../services/messageServices.js';
import { roomInfoService } from '../services/roomInfoService.js';
import { removeParticipant } from '../services/roomServices.js';
import { chatMessageType, MessageType } from '../dtos/messageDto.js';

export default function chatHandler(io: Server, socket: Socket) {
  const user = socket.data.user;
  const userId = user.userId;
  console.log(`✅ 인증된 사용자 접속: ${user.nickname} (${userId}) , socketId: ${socket.id}`);
  /**
   * room 소캣 이벤트
   */

  //새로운 방 입장
  socket.on('joinRoom', async (data: { roomId: number; nickname: string }) => {
    try {
      const { roomId, nickname } = data;
      if (!roomId || !nickname) {
        socket.emit('error', { type: 'joinRoom', message: 'roomId and nickname required' });
        return;
      }
      //입장
      socket.join(roomId.toString());
      console.log('[Socket] entered room:', roomId);

      //redis
      const redis = await joinRoom(roomId, Number(userId), socket.id);
      console.log('[Socket] 입장 REDIS 처리: ', redis);

      io.to(roomId.toString()).emit('userJoined', {
        user: nickname,
        count: io.sockets.adapter.rooms.get(roomId.toString())?.size || 0,
      });
      console.log(`[Socket] ${nickname}님이 ${roomId} 방에 입장`);

      socket.emit('success', { type: 'joinRoom', message: '방 참여 성공' });
    } catch (error) {
      console.log('[Socket] joinRoom 소캣 통신에러:', error);
      socket.emit('error', { type: 'joinRoom', message: '방 참여 실패' });
    }
  });

  //기존 방 입장
  socket.on('enterRoom', async (data: { roomId: number; nickname: string }) => {
    try {
      const { roomId, nickname } = data;
      if (!nickname || !roomId) {
        socket.emit('error', { type: 'enterRoom', message: 'Required fields are missing.' });
        return;
      }

      const isIn = await isParticipant(Number(roomId), Number(userId));
      if (!isIn) {
        socket.emit('error', {
          type: 'enterRoom',
          message: '방 입장 실패 (해당하는 방의 참가자 아님)',
        });
        return;
      }
      //해당 소캣이 room에 join함
      socket.join(roomId.toString());
      console.log('[Socket] entered room:', roomId);

      //redis
      const res = await enterRoom(Number(userId), socket.id);
      console.log('[Socket] enterRoom 이벤트 성공, redis: ', res);

      socket.emit('success', { type: 'enterRoom', message: '방 입장 성공' });
    } catch (error) {
      console.log('[Socket] enterRoom 소캣 통신에러:', error);
      socket.emit('error', { type: 'enterRoom', message: '방 입장 실패' });
    }
  });

  // 방 메시지 보내기
  socket.on(
    'sendRoomMessage',
    async (data: { roomId: number; nickname: string; content: string; messageType: string }) => {
      try {
        const { roomId, nickname, content, messageType } = data;
        if (!roomId || !nickname || !content || !messageType) {
          socket.emit('error', {
            type: 'sendRoomMessage',
            message: 'Required fields are missing.',
          });
          return;
        }
        const validRoomMessageTypes: MessageType[] = ['general', 'system'];
        if (!validRoomMessageTypes.includes(messageType as MessageType)) {
          socket.emit('error', {
            type: 'sendRoomMessage',
            message: 'Invalid messageType (messageType must be general or system)',
          });
          return;
        }

        const isIn = await isParticipant(roomId, Number(userId));
        if (!isIn) {
          socket.emit('error', {
            type: 'sendRoomMessage',
            message: '방 채팅 실패 (해당하는 방의 참가자 아님)',
          });
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
        console.log(`[Socket] 메시지: ${message}`);

        socket.emit('success', { type: 'sendRoomMessage', message: '방 채팅 성공' });
      } catch (error) {
        console.log('[Socket] sendRoomMessage 소캣 통신에러:', error);
        socket.emit('error', { type: 'sendRoomMessage', message: '방 채팅 실패' });
      }
    },
  );

  //방 설정 변경 수신
  socket.on('updateRoomSettings', async (roomId: number) => {
    try {
      if (!roomId) {
        socket.emit('error', {
          type: 'updateRoomSettings',
          message: 'Required fields are missing.',
        });
        return;
      }
      const updatedRoom = await roomInfoService.getRoomInfoById(roomId);

      //변경된 설정 브로드캐스트
      io.to(roomId.toString()).emit('roomSettingsUpdated', { updatedRoom });

      console.log(`[ROOM ${roomId}] Settings updated by owner ${userId}`);

      socket.emit('success', { type: 'updateRoomSettings', message: '방 설정 성공' });
    } catch (error) {
      console.log('[Socket] sendRoomMessage 소캣 통신에러:', error);
      socket.emit('error', { type: 'updateRoomSettings', message: '방 설정 실패' });
    }
  });

  //room 퇴장
  socket.on('leaveRoom', async (roomId: number) => {
    try {
      //퇴장 db 처리
      const leaveDB = await removeParticipant(roomId, userId);
      console.log('leaveRoom 디비 처리:', leaveDB);
      await leaveRoom(roomId, Number(userId));
      socket.leave(roomId.toString());
      io.to(roomId.toString()).emit('userLeft', { userId, socketId: socket.id });

      socket.emit('success', { type: 'leaveRoom', message: '방 퇴장 성공' });
    } catch (err) {
      console.error('[Socket] leaveRoom error:', err); // 서버 로그 확인용
      socket.emit('error', { type: 'leaveRoom', message: '방 퇴장 실패' });
    }
  });

  socket.on('disconnect', async () => {
    const userId = socket.data.user.id;
    await offlineUser(userId, socket.id);
  });

  /**
   * 1:1 채팅
   */

  //1:1 DM 방 입장
  socket.on('joinDM', async (data: { receiverId: number }) => {
    try {
      const { receiverId } = data;

      if (!receiverId) {
        socket.emit('error', { type: 'joinDM', message: 'Required fields are missing.' });
        return;
      }

      const dmRoom = await getOrCreateChatRoom(userId, receiverId);
      const dmId = dmRoom.chatId;

      socket.join(dmId.toString());
      console.log('[Socket] entered dm:', dmId);

      console.log(`[Socket] ${userId}님이 ${dmId} dm 방에 입장`);
      socket.emit('success', { type: 'joinDM', message: 'DM 입장 성공' });
    } catch (err) {
      console.error('[Socket] joinDM error:', err);
      socket.emit('error', { type: 'joinDM', message: 'dm 입장 실패' });
    }
  });

  // 1:1 DM 보내기
  socket.on(
    'sendDirectMessage',
    async (data: { receiverId: number; content: string; messageType: string }) => {
      try {
        const { receiverId, content, messageType } = data;
        if (!receiverId || !content || !messageType) {
          socket.emit('error', {
            type: 'sendDirectMessage',
            message: 'Required fields are missing.',
          });
          return;
        }

        const dmRoom = await getChatRoom(userId, receiverId);
        const dmId = dmRoom.chatId;

        //DB 저장
        const validMessageTypes = ['general', 'collectionShare', 'roomInvite'];
        if (!validMessageTypes.includes(messageType)) {
          socket.emit('error', { type: 'sendDirectMessage', message: 'Invalid message type' });
          return;
        }
        const message = await saveDirectMessage(userId, {
          receiverId,
          content,
          type: messageType as chatMessageType,
        });

        //전송
        console.log(`[Socket] DM 전송 준비 완료: ${userId} -> ${dmId}`);
        io.to(dmId.toString()).emit('receiveDirectMessage', { data: message });
        console.log(`[Socket] DM 전송 완료: ${userId} -> ${dmId}: ${content}`);

        socket.emit('success', { type: 'sendDirectMessage', message: 'DM 채팅 성공' });
      } catch (err) {
        console.error('[Socket] sendDirectMessage error:', err); // 서버 로그 확인용
        socket.emit('error', { type: 'sendDirectMessage', message: 'dm 입장 실패' });
      }
    },
  );

  //dm방 삭제 - 친구 해제
  socket.on('unFriend', async (data: { userId1: number; userId2: number }) => {
    try {
      const { userId1, userId2 } = data;
      if (!userId1 || !userId2) {
        socket.emit('error', { type: 'unFriend', message: 'Invalid message type' });
        return;
      }
      const dmRoom = await getChatRoom(userId1, userId2);
      const dmId = dmRoom.chatId;
      socket.leave(dmId.toString());
      console.log(`[Socket] 친구 방 삭제 - ${dmId} 삭제 : ${userId1}, ${userId2}`);

      socket.emit('success', { type: 'unFriend', message: '친구 해제 성공' });
    } catch (err) {
      console.error('[Socket] unFriend error:', err); // 서버 로그 확인용
      socket.emit('error', { type: 'unFriend', message: 'Failed to leave room' });
    }
  });

  /**
   * 북마크 공유
   */
}
