const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = path.join(__dirname, 'messages.json');

let messages = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    messages = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    messages = [];
  }
}

function saveMessages() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Serve the manifest.json file
app.get('/manifest.json', (req, res) => {
  res.sendFile(__dirname + '/manifest.json');
});

io.on('connection', (socket) => {
  socket.emit('load messages', messages);

  socket.on('send message', (data) => {
    const newMessage = {
      id: Date.now(),
      user: data.user || 'Anonymous',
      type: data.type || 'text',
      content: data.content,
      viewOnce: data.viewOnce || false,
      viewed: false,
      replyTo: data.replyTo || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    if (messages.length > 150) messages.shift();
    saveMessages();

    io.emit('new message', newMessage);
  });

  socket.on('consume view-once', (msgId) => {
    const msg = messages.find(m => m.id == msgId);
    if (msg && msg.viewOnce && !msg.viewed) {
      msg.viewed = true;
      msg.content = '[Expired / Opened View-Once Media]';
      saveMessages();
      io.emit('view-once opened', msgId);
    }
  });

  socket.on('call-user', (data) => {
    socket.broadcast.emit('incoming-call', { from: data.from, offer: data.offer });
  });

  socket.on('make-answer', (data) => {
    socket.broadcast.emit('call-answered', { answer: data.answer });
  });

  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
