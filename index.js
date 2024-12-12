const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
let messages = [];
let users = {};
app.get('/', (req, res) => {
  res.render('index');
});
io.on('connection', (socket) => {
  socket.emit('previous messages', messages);
  socket.on('set username', (username) => {
    users[socket.id] = username;
    const systemMessage = {
      text: `${username} has joined the chat.`,
      sender: 'System',
      id: `system-${Date.now()}`,
      type: 'system',
      timestamp: new Date().toLocaleTimeString()
    };
    messages.push(systemMessage);
    io.emit('chat message', systemMessage);
  });
  socket.on('chat message', (msg) => {
    if (users[socket.id]) {
      const message = {
        text: msg,
        sender: users[socket.id],
        id: socket.id + Date.now(),
        timestamp: new Date().toLocaleTimeString()
      };
      messages.push(message); 
      io.emit('chat message', message);
    }
  });
  socket.on('clear chat', () => {
    messages = [];
    io.emit('clear chat');
  });
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      const systemMessage = {
        text: `${username} has left the chat.`,
        sender: 'System',
        id: `system-${Date.now()}`,
        type: 'system',
        timestamp: new Date().toLocaleTimeString()
      };
      messages.push(systemMessage);
      io.emit('chat message', systemMessage);
    }
  });
});
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
