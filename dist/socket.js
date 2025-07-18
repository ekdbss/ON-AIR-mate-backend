// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }, // 개발용
});
// 소켓 연결 처리
io.on('connection', (socket) => {
    console.log(`🟢 사용자 연결됨: ${socket.id}`);
    socket.on('chat message', (msg) => {
        console.log(`💬 메시지: ${msg}`);
        io.emit('chat message', msg); // 모든 사용자에게 전송
    });
    socket.on('disconnect', () => {
        console.log(`🔴 연결 해제: ${socket.id}`);
    });
});
// HTTP 서버 시작
httpServer.listen(3000, () => {
    console.log('🚀 서버 실행 중: http://localhost:3000');
});
