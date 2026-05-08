const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { setupWSConnection } = require('y-websocket/bin/utils');
const WebSocket = require('ws');

const app = express();
app.use(cors());

const server = http.createServer(app);

// ── Yjs WebSocket Setup ──────────────────────────────────────────────────
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true });
});

// Handle the upgrade from HTTP to WebSocket for Yjs
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  
  // Route /yjs to the Yjs server, others can be handled by Socket.io
  if (pathname.startsWith('/yjs')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// ── Socket.IO Setup ──────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on('connection', (socket) => {
  socket.on('join', ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit('joined', { clients, username, socketId: socket.id });
    });
  });

  socket.on('chat-message', ({ roomId, message, username, timestamp }) => {
    io.to(roomId).emit('chat-message', { message, username, timestamp });
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit('disconnected', { socketId: socket.id, username: userSocketMap[socket.id] });
    });
  });

  // WebRTC Signaling
  socket.on('start-call', ({ roomId, username }) => {
    socket.in(roomId).emit('incoming-call', { caller: username, callerId: socket.id });
  });
  socket.on('webrtc-offer', ({ target, caller, sdp }) => {
    io.to(target).emit('webrtc-offer', { caller, callerId: socket.id, sdp });
  });
  socket.on('webrtc-answer', ({ target, sdp }) => {
    io.to(target).emit('webrtc-answer', { responderId: socket.id, sdp });
  });
  socket.on('webrtc-ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('webrtc-ice-candidate', { senderId: socket.id, candidate });
  });

  socket.on('join-call', ({ roomId }) => {
    socket.in(roomId).emit('user-joined-call', { userId: socket.id });
  });

  socket.on('leave-call', ({ roomId }) => {
    socket.in(roomId).emit('user-left-call', { userId: socket.id });
  });

  // Security & Authorization Events
  socket.on('request-join', ({ roomId, username }) => {
    socket.in(roomId).emit('join-request', { username, socketId: socket.id });
  });

  socket.on('approve-join', ({ targetSocketId, roomId }) => {
    io.to(targetSocketId).emit('join-approved', { roomId });
  });

  socket.on('reject-join', ({ targetSocketId }) => {
    io.to(targetSocketId).emit('join-rejected');
  });

  socket.on('update-permissions', ({ roomId, targetSocketId, role }) => {
    io.to(targetSocketId).emit('permission-updated', { role });
    socket.in(roomId).emit('user-permission-changed', { socketId: targetSocketId, role });
  });

  socket.on('disconnect', () => {
    delete userSocketMap[socket.id];
  });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`Unified Server listening on port ${PORT}`));
