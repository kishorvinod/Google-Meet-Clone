const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

const participants = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join-room', (roomId, userId, userName) => {
    if (!participants[roomId]) {
      participants[roomId] = [];
    }

    participants[roomId].push({ userId, userName });
    socket.join(roomId);

    console.log(`User ${userName} joined room ${roomId}`);

    // Emit 'user-connected' after joining the room
    socket.to(roomId).emit('user-connected', userId, userName);
    io.in(roomId).emit('participants-update', participants[roomId]);
    console.log('Participants in room:', participants[roomId]);

    socket.on('disconnect', () => {
      participants[roomId] = participants[roomId].filter(participant => participant.userId !== userId);
      socket.to(roomId).emit('user-disconnected', userId);
      io.in(roomId).emit('participants-update', participants[roomId]);
      console.log(`User ${userName} disconnected from room ${roomId}`);
      console.log('Participants in room:', participants[roomId]);
    });

    socket.on('sending-signal', payload => {
      io.to(payload.userToSignal).emit('user-joined', {
        signal: payload.signal,
        callerID: payload.callerID,
        userName: payload.userName,
      });
    });

    socket.on('returning-signal', payload => {
      io.to(payload.callerID).emit('receiving-returned-signal', {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on('send-message', (message, roomId) => {
      io.in(roomId).emit('receive-message', message);
    });
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
