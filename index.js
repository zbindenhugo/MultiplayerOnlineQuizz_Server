const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
    socket.join(roomId);

    socket.data.admin ? socket.data.admin = true : socket.data.admin = false;

    const sockets = await io.in(roomId).fetchSockets();
    var players = [];
    for (const socket of sockets) {
      players.push({id: socket.id, username: socket.data.username, admin: socket.data.admin});
    }

    io.to(roomId).emit('receive_all_players', players);
  })

  socket.on('is_admin', () => {
    socket.emit('is_admin_answered', socket.data.admin)
  })

  socket.on('get_all_categories', async () => {

    if(socket.data.admin){
      const categories = await fetch('https://the-trivia-api.com/api/categories');
      const result = await categories.json();
    
      socket.emit('receive_all_categories', result);
    }
    
  })

  socket.on('begin_game', async (data) => {
    const questions = await fetch(`https://the-trivia-api.com/api/questions?${data.difficulty ? 'difficulty=' + data.difficulty.toLowerCase() + '&' : ''}${data.categorie ? 'categories=' + data.categorie + '&' : ''}${data.nbQuestions !== 10 ? 'limit=' + data.nbQuestions : 'limit=10'}`)
    const questionJson = await questions.json();

    console.log(questionJson);
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


