const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('get_socket_id', () => {
    socket.emit("receive_socket_id", socket.id);
  })

  socket.on('set_username_socket', (username) => {
    socket.data.username = username;
  })

  socket.on('create_room', () => {
    var roomId = generateRandomPassword();

    socket.join(roomId);
    socket.data.admin = true;
    socket.emit('generated_room', roomId);
  })

  socket.on('joined_room', async (roomId) => {
    const sockets = await io.in(roomId).fetchSockets();
    var players = [];
    for (const socket of sockets) {
      players.push({id: socket.id, username: socket.data.username});
    }

    io.to(roomId).emit('receive_all_players', players);
  })

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    
  });
});

server.listen(8000, () => {
  console.log("SERVER RUNNING");
});

/* PARTIE FONCTIONS */
function generateRandomPassword(){
  return Math.random().toString(36).slice(-6)
}


