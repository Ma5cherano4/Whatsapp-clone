const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Set high buffer limit (100MB) to handle image payloads safely
const io = new Server(server, {
  maxHttpBufferSize: 1e8
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    io.emit('chat message', {
      id: data.id,
      text: data.text,
      image: data.image,
      isViewOnce: data.isViewOnce,
      user: data.user,
      time: data.time,
      senderId: socket.id
    });
  });

  socket.on('view once opened', (msgId) => {
    io.emit('view once opened', msgId);
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});