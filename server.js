const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chatMessage', (data) => {
    const messagePayload = {
      id: Date.now().toString(),
      senderId: socket.id,
      senderName: `User_${socket.id.substring(0, 4)}`,
      text: data.text,
      replyTo: data.replyTo ? {
        id: data.replyTo.id,
        sender: data.replyTo.sender,
        text: data.replyTo.text
      } : null
    };

    // Broadcast message to all connected clients
    io.emit('message', messagePayload);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
