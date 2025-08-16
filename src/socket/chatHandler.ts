import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import {
  joinRoom,
  enterRoom,
  leaveRoom,
  isParticipant,
  offlineUser,
  setRoomVideoState,
  updateRoomVideoTime,
  getRoomVideoState,
  deleteRoomVideoState,
  removeAllParticipantsFromRoom,
} from './redisManager.js';
import {
  saveRoomMessage,
  saveDirectMessage,
  getOrCreateChatRoom,
  getChatRoom,
} from '../services/messageServices.js';
import { roomInfoService } from '../services/roomInfoService.js';
import { isHost, getParticipants } from '../services/roomServices.js';
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
        socket.emit('error', { type: 'joinRoom', data: 'roomId and nickname required' });
        return;
      }
      //입장
      socket.join(roomId.toString());
      console.log('[Socket] entered room:', roomId);

      const role = await isHost(roomId, userId);

      //redis
      const redis = await joinRoom(roomId, Number(userId), socket.id);
      console.log('[Socket] 입장 REDIS 처리: ', redis);
      const broom = await prisma.room.findUnique({
        where: { roomId },
      });

      if (!broom) {
        socket.emit('error', { type: 'joinRoom', data: '방장이 탈퇴한 방입니다.' });
      }

      io.to(roomId.toString()).emit('userJoined', {
        data: {
          user: nickname,
          count: io.sockets.adapter.rooms.get(roomId.toString())?.size || 0,
        },
      });
      console.log(`[Socket] ${nickname}님이 ${roomId} 방에 입장`);

      socket.emit('roomEnterSuccess', {
        type: 'joinRoom',
        data: {
          message: '방 참여 성공',
          user: { nickname: user.nickname, role: role },
        },
      });

      /**
       * 방 영상 정보 동기화
       */
      //방장일 경우
      //북마크로 방 생성일 경우 -> room startTime으로 시작

      if (role === 'host') {
        await setRoomVideoState(roomId, 'playing', broom?.startTime ?? 0);
        io.to(roomId.toString()).emit('video:play', {
          type: 'video:play',
          data: {
            roomId,
            currentTime: 0,
            updatedAt: Date.now(),
          },
        });
        console.log('[Socket] [host] video:play 소캣 이벤트 전송 완료 ->', user.nickname);
      }
      //참가자일경우
      else {
        const videoState = await getRoomVideoState(roomId);
        if (videoState) {
          let syncTime = videoState.time;
          if (videoState.status === 'playing') {
            const elapsed = (Date.now() - videoState.updatedAt) / 1000;
            syncTime += elapsed;
          }
          console.log(
            `[Socket] videoStatus 확인 완료-> status: ${videoState.status}, time: ${videoState.time}, syncTime: ${syncTime}`,
          );
          socket.emit('video:sync', {
            type: 'video:sync',
            data: { roomId, currentTime: syncTime, status: videoState.status },
          });
          console.log('[Socket]  [participant] video:sync 소캣 이벤트 전송 완료 ->', user.nickname);
        }
      }
    } catch (error) {
      console.log('[Socket] joinRoom 소캣 통신에러:', error);
      socket.emit('error', { type: 'joinRoom', data: '방 참여 실패' });
    }
  });

  //기존 방 입장
  socket.on('enterRoom', async (data: { roomId: number; nickname: string }) => {
    try {
      const { roomId, nickname } = data;
      if (!nickname || !roomId) {
        socket.emit('error', { type: 'enterRoom', data: 'Required fields are missing.' });
        return;
      }

      const isIn = await isParticipant(Number(roomId), Number(userId));
      console.log('[redis] 참가자 확인: ', isIn);
      if (!isIn) {
        socket.emit('error', {
          type: 'enterRoom',
          data: '방 입장 실패 (해당하는 방의 참가자 아님)',
        });
        return;
      }
      const role = await isHost(roomId, userId);

      //해당 소캣이 room에 join함
      socket.join(roomId.toString());
      console.log('[Socket] entered room:', roomId);

      //redis
      const res = await enterRoom(Number(userId), socket.id);
      console.log('[Socket] enterRoom 이벤트 성공, redis: ', res);

      socket.emit('roomEnterSuccess', {
        type: 'enterRoom',
        data: {
          message: '방 입장 성공',
          user: { nickname: user.nickname, role: role },
        },
      });

      /**
       * 방 영상 정보 동기화
       */
      const videoState = await getRoomVideoState(roomId);
      let syncTime = videoState.time;
      //방장일 경우
      if (role === 'host') {
        await setRoomVideoState(roomId, 'playing', syncTime);
        io.to(roomId.toString()).emit('video:play', {
          roomId,
          currentTime: syncTime,
          updatedAt: Date.now(),
        });
        console.log('[Socket] [host] video:play 소캣 이벤트 전송 완료 ->', user.nickname);
      }
      //참가자일경우
      else {
        if (videoState) {
          if (videoState.status === 'playing') {
            const elapsed = (Date.now() - videoState.updatedAt) / 1000;
            syncTime += elapsed;
          }
          console.log(
            `[Socket] videoStatus 확인 완료-> status: ${videoState.status}, time: ${videoState.time}, syncTime: ${syncTime}`,
          );
          socket.emit('video:sync', {
            type: 'video:sync',
            data: { roomId, currentTime: syncTime, status: videoState.status },
          });
          console.log('[Socket]  [participant] video:sync 소캣 이벤트 전송 완료 ->', user.nickname);
        }
      }
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
            data: 'Required fields are missing.',
          });
          return;
        }
        const validRoomMessageTypes: MessageType[] = ['general', 'system'];
        if (!validRoomMessageTypes.includes(messageType as MessageType)) {
          socket.emit('error', {
            type: 'sendRoomMessage',
            data: 'Invalid messageType (messageType must be general or system)',
          });
          return;
        }

        const isIn = await isParticipant(roomId, Number(userId));
        if (!isIn) {
          socket.emit('error', {
            type: 'sendRoomMessage',
            data: '방 채팅 실패 (해당하는 방의 참가자 아님)',
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

        socket.emit('success', { type: 'sendRoomMessage', data: '방 채팅 성공' });
      } catch (error) {
        console.log('[Socket] sendRoomMessage 소캣 통신에러:', error);
        socket.emit('error', { type: 'sendRoomMessage', data: '방 채팅 실패' });
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
      if (updatedRoom) console.log('[SOCKET] 방 설정 업데이트 준비 완료:', updatedRoom.roomTitle);

      //변경된 설정 브로드캐스트
      io.to(roomId.toString()).emit('roomSettingsUpdated', {
        type: 'roomSettingsUpdated',
        data: updatedRoom,
      });

      console.log(`[SOCKET] [ROOM ${roomId}] Settings updated by owner ${userId}`);

      socket.emit('success', { type: 'updateRoomSettings', data: '방 설정 성공' });
    } catch (error) {
      console.log('[Socket] sendRoomMessage 소캣 통신에러:', error);
      socket.emit('error', { type: 'updateRoomSettings', data: '방 설정 실패' });
    }
  });

  //room 퇴장
  socket.on('leaveRoom', async (roomId: any) => {
    try {
      const parsedRoomId = typeof roomId === 'object' ? roomId.roomId : roomId;
      console.log('[leave Room] 파라미터 확인:', roomId, ', 파싱해서:', parsedRoomId);

      const role = await isHost(Number(parsedRoomId), userId);

      //redis 처리
      const leaveres = await leaveRoom(Number(parsedRoomId), Number(userId));
      console.log('[leave Room] [Socket] leaveRoom Redis 처리: ', leaveres);
      socket.leave(parsedRoomId.toString());

      //현재 참여자 목록 업데이트
      const nowParticipants = await getParticipants(parsedRoomId);

      //방 재생 정보 동기화 -멈춤
      if (role === 'host') {
        io.to(parsedRoomId.toString()).emit('video:pause', {
          type: 'video:pause',
          data: { parsedRoomId, currentTime: 0 },
        });

        io.to(parsedRoomId.toString()).emit('userLeft', {
          type: 'userLeft',
          data: {
            leftUser: user.nickname,
            role: role,
            roomParticipants: nowParticipants,
          },
        });
        //redis data 정리
        const leaveres2 = await deleteRoomVideoState(Number(parsedRoomId));
        const delRedis = await removeAllParticipantsFromRoom(Number(parsedRoomId));
        console.log('[Socket] 방장 나감 Redis 처리: ', leaveres2, '소캣 룸 처리:', delRedis);

        // 남은 참가자 소켓 연결도 강제 중단
        const socketsInRoom = await io.in(parsedRoomId.toString()).fetchSockets();
        for (const socket of socketsInRoom) {
          socket.leave(parsedRoomId.toString());
          console.log('[Socket] 참가자 강퇴:', socket.data);
        }
      } else {
        io.to(parsedRoomId.toString()).emit('userLeft', {
          type: 'userLeft',
          data: {
            leftUser: user.nickname,
            role: role,
            roomParticipants: nowParticipants,
          },
        });
        console.log('[Socket] 참가자 나감 참가자 목록 업데이트: ', nowParticipants);
      }
      socket.emit('success', { type: 'leaveRoom', data: '방 퇴장 성공' });
    } catch (err) {
      console.error('[Socket] leaveRoom error:', err); // 서버 로그 확인용
      socket.emit('error', { type: 'leaveRoom', data: '방 퇴장 실패' });
    }
  });

  socket.on('disconnect', async () => {
    const userId = socket.data.user.id;
    await offlineUser(userId, socket.id);
  });

  /**
   * 방 영상 정보 동기화
   */
  // 영상 재생
  socket.on('video:play', async ({ roomId, currentTime }) => {
    try {
      const isRoomHost = await isHost(roomId, userId);
      if (!isRoomHost) return; // 방장 아니면 무시
      const resRedis = await setRoomVideoState(roomId, 'playing', currentTime);
      console.log('[REDIS] 방 playing 재생 정보 저장: ', resRedis);
      io.to(roomId.toString()).emit('video:play', {
        type: 'video:sync',
        data: { roomId, currentTime, updatedAt: Date.now() },
      });
      console.log(
        '[Socket] video:play 소캣 이벤트 전송 완료 ->',
        user.nickname,
        'time: ',
        currentTime,
      );
      socket.emit('success', { type: 'video:play', data: '방 영상 재생 성공' });
    } catch (err) {
      console.error('[Socket] video:play error:', err); // 서버 로그 확인용
      socket.emit('error', { type: 'video:play', data: '방 영상 재생 실패' });
    }
  });

  //영상 멈춤
  socket.on('video:pause', async ({ roomId, currentTime }) => {
    try {
      if (!(await isHost(roomId, userId))) return;
      const resRedis = await setRoomVideoState(roomId, 'paused', currentTime);
      console.log('[REDIS] 방 pause 재생 정보 저장: ', resRedis);
      io.to(roomId.toString()).emit('video:pause', {
        type: 'video:pause',
        data: { roomId, currentTime },
      });
      console.log(
        '[Socket] video:pause 소캣 이벤트 전송 완료 ->',
        user.nickname,
        'time: ',
        currentTime,
      );
      socket.emit('success', { type: 'video:pause', data: '방 영상 멈춤 성공' });
    } catch (err) {
      console.error('[Socket] video:pause error:', err);
    }
  });

  //영상 재생 시간 동기화
  socket.on('video:sync', async ({ roomId, currentTime }) => {
    try {
      if (!(await isHost(roomId, userId))) return;
      const updres = await updateRoomVideoTime(roomId, currentTime);
      console.log('[REDIS] 방 재생 정보 동기화 업데이트: ', updres);
      socket.emit('success', { type: 'video:sync', data: '방 영상 동기화 업데이트 성공' });
    } catch (err) {
      console.error('[Socket] video:sync error:', err);
    }
  });

  /**
   * 1:1 채팅
   */

  //1:1 DM 방 입장
  socket.on('joinDM', async (data: { receiverId: number }) => {
    try {
      const { receiverId } = data;

      if (!receiverId) {
        socket.emit('error', { type: 'joinDM', data: 'Required fields are missing.' });
        return;
      }

      const dmRoom = await getOrCreateChatRoom(userId, receiverId);
      const dmId = dmRoom.chatId;

      socket.join(dmId.toString());
      console.log('[Socket] entered dm:', dmId);

      console.log(`[Socket] ${userId}님이 ${dmId} dm 방에 입장`);
      socket.emit('success', { type: 'joinDM', data: 'DM 입장 성공' });
    } catch (err) {
      console.error('[Socket] joinDM error:', err);
      socket.emit('error', { type: 'joinDM', data: 'dm 입장 실패' });
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
            data: 'Required fields are missing.',
          });
          return;
        }

        const dmRoom = await getChatRoom(userId, receiverId);
        const dmId = dmRoom.chatId;

        //DB 저장
        const validMessageTypes = ['general', 'collectionShare', 'roomInvite'];
        if (!validMessageTypes.includes(messageType)) {
          socket.emit('error', { type: 'sendDirectMessage', data: 'Invalid message type' });
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

        socket.emit('success', { type: 'sendDirectMessage', data: 'DM 채팅 성공' });
      } catch (err) {
        console.error('[Socket] sendDirectMessage error:', err); // 서버 로그 확인용
        socket.emit('error', { type: 'sendDirectMessage', data: 'dm 입장 실패' });
      }
    },
  );

  //dm방 삭제 - 친구 해제
  socket.on('unFriend', async (data: { userId1: number; userId2: number }) => {
    try {
      const { userId1, userId2 } = data;
      if (!userId1 || !userId2) {
        socket.emit('error', { type: 'unFriend', data: 'Invalid message type' });
        return;
      }
      const dmRoom = await getChatRoom(userId1, userId2);
      const dmId = dmRoom.chatId;
      socket.leave(dmId.toString());
      console.log(`[Socket] 친구 방 삭제 - ${dmId} 삭제 : ${userId1}, ${userId2}`);

      socket.emit('success', { type: 'unFriend', data: '친구 해제 성공' });
    } catch (err) {
      console.error('[Socket] unFriend error:', err); // 서버 로그 확인용
      socket.emit('error', { type: 'unFriend', data: 'Failed to leave room' });
    }
  });

  /**
   * 북마크 공유
   */
}
