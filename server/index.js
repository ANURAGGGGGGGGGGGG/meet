import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  let currentRoom = null;
  let participantName = "Anonymous";

  socket.on("join-room", ({ roomId, name }) => {
    participantName = name || `User-${Math.random().toString(36).slice(2, 6)}`;
    currentRoom = roomId;

    if (!rooms[roomId]) {
      rooms[roomId] = { id: roomId, participants: [] };
    }

    socket.join(roomId);
    rooms[roomId].participants.push({
      id: socket.id,
      name: participantName,
    });

    socket.to(roomId).emit("user-joined", {
      id: socket.id,
      name: participantName,
    });

    const participants = rooms[roomId].participants
      .filter((p) => p.id !== socket.id)
      .map((p) => ({ id: p.id, name: p.name }));

    socket.emit("room-users", { participants });
  });

  socket.on("signal", ({ to, signal }) => {
    io.to(to).emit("signal", { from: socket.id, signal });
  });

  socket.on("send-message", ({ roomId, message }) => {
    const room = rooms[roomId];
    if (!room) return;
    const participant = room.participants.find((p) => p.id === socket.id);
    const name = participant ? participant.name : "Anonymous";
    io.to(roomId).emit("receive-message", {
      senderId: socket.id,
      senderName: name,
      message,
      timestamp: Date.now(),
    });
  });

  socket.on("toggle-camera", ({ roomId, enabled }) => {
    socket.to(roomId).emit("participant-camera-toggled", {
      id: socket.id,
      enabled,
    });
  });

  socket.on("toggle-mic", ({ roomId, enabled }) => {
    socket.to(roomId).emit("participant-mic-toggled", {
      id: socket.id,
      enabled,
    });
  });

  socket.on("screen-share-started", ({ roomId }) => {
    socket.to(roomId).emit("participant-screen-share-started", {
      id: socket.id,
    });
  });

  socket.on("screen-share-stopped", ({ roomId }) => {
    socket.to(roomId).emit("participant-screen-share-stopped", {
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom].participants = rooms[currentRoom].participants.filter(
        (p) => p.id !== socket.id,
      );
      socket.to(currentRoom).emit("user-left", { id: socket.id });
      if (rooms[currentRoom].participants.length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
