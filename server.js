const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = path.join(__dirname, 'messages.json');

// Load saved messages from disk so they persist permanently
let messages = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    messages = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    messages = [];
  }
}

// Function to save messages permanently
function saveMessages() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send all stored message history (even past ones) to anyone who connects or refreshes
  socket.emit('load messages', messages);

  // Handle incoming messages
  socket.on('send message', (data) => {
    if (!data.text || data.text.trim() === '') return;

    const newMessage = {
      id: Date.now(),
      user: data.user && data.user.trim() !== '' ? data.user.trim() : 'Anonymous',
      text: data.text.trim(),
      replyTo: data.replyTo || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    
    // Keep a maximum of 200 history messages saved
    if (messages.length > 200) {
      messages.shift();
    }

    saveMessages(); // Permanently save to file
    io.emit('new message', newMessage);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Persistent Chat server running on port ${PORT}`);
});
