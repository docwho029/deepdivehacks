const express = require("express");
const path = require('path');
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.set('views', './views')
app.set('view-engine', 'ejs')
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({extended:true}))

const rooms  = { };
// rooms = {roomName: {users: {socket.id : name}}}s

app.get('/', (req, res)=> {
  res.render('index.ejs', {rooms: rooms})
});

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/');
  };
  rooms[req.body.room] = {users: {}};
  res.redirect(req.body.room);
  // send msg that new room was created thru sockets
  io.emit('room-created', req.body.room);
})

app.get('/:room', (req, res) => {
  if (rooms[req.body.room] != null) return res.redirect('/');
  res.render('room.ejs', {roomName: req.params.room })
})


io.on("connection", (socket) => {
  socket.on('new-user', (room, name) => {
    socket.join(room);
    rooms[room].users[socket.id] = name;
    socket.broadcast.to(room).emit('user-connected', name);
    // socket.broadcast.emit('user-connected', name);
  })

  socket.on('send-chat-message', (room, message) => {
    socket.broadcast.to(room).emit('chat-message', {message: message, name: rooms[room].users[socket.id]})
    // socket.broadcast.emit('chat-message', {message: message, name: rooms[room].users[socket.id]})
  })

  socket.on('disconnect', ()=> {
    getUserRooms(socket).forEach(room => {
      socket.broadcast.to(room).emit('user-disconnected', rooms[room].users[socket.id]);
      delete rooms[room].users[socket.id];
    })
  })
});

httpServer.listen(3000, ()=>{
  console.log('listening');
});

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names;
  }, [])
}

// ----------------------------------------
// const app = require('express')();
// const http = require('http').Server(app);
// const io = require('socket.io')(http);
// const port = process.env.PORT || 3000;

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

// io.on('connection', (socket) => {
//   console.log('coonection bro');
//   socket.emit('chat message', 'hey');
// });

// http.listen(port, () => {
//   console.log(`Socket.IO server running at http://localhost:${port}/`);
// });
