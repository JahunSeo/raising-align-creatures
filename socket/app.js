// https://socket.io/docs/v4/server-initialization/
const express = require("express");
const { createServer } = require("http"); // how to initialize with https?
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
// https://socket.io/docs/v3/handling-cors/
const options = {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
}; //if needed
const io = new Server(httpServer, options);

// const Room = require("./classes/Room");
// const User = require("./classes/User");

const Room = require("../client/src/shared/room/RoomSocket");
const User = require("../client/src/shared/room/User");

const rooms = {};
const users = {};

io.on("connection", (socket) => {
  console.log(`[socket server] connection with ${socket.id}`);
  const clientId = socket.id;

  handleJoin = (roomId) => {
    console.log(`[socket server] join ${clientId}, ${roomId}`);
    // 새로운 user 생성
    if (users[clientId]) return false; // ERROR
    const user = new User(clientId); // TODO: user email
    users[clientId] = user;

    // 해당 room에 user 추가
    if (!rooms[roomId]) {
      rooms[roomId] = new Room(roomId);
      rooms[roomId].start(io);
    }
    // user에 room 추가 및 join
    user.enterRoom(roomId);
    socket.join(roomId);

    let result = rooms[roomId].addParticipant(user);
    if (!result) return false; // ERROR

    // broadcasting to all
    // io.to(roomId).emit("fieldState", rooms[roomId].getFieldState());
  };

  handleChangeDestination = (data) => {
    console.log(`[socket server] changeDestination`, clientId, data);
    const { roomId, monster } = data;
    if (!rooms[roomId]) {
      console.log(`[socket server] changeDestination ERROR!!`);
      console.log(` ==> there is no room of id ${roomId}`);
      // TODO: client에 에러 전달?
      return false;
    }

    // update monster destination
    rooms[roomId].updateMonster(clientId, monster);

    // broadcasting to all
    // io.to(roomId).emit("fieldState", rooms[roomId].getFieldState());
  };

  handleDisconnect = () => {
    // 방에서 참가자 제거
    console.log(`[socket server] disconnect user ${clientId}`);
    const user = users[clientId];
    if (!user) return false; // ERROR

    const roomId = user.getParticipatingRooms();
    let remaining_num = rooms[roomId].removeParticipant(user);

    // 유저 제거
    delete users[clientId];

    // 방에 참가자가 아무도 없는 경우, 방 제거
    if (remaining_num <= 0) {
      // close room
      rooms[roomId].close();
      delete rooms[roomId];
    }
    // 방에 참가자가 남아 있는 경우, 남은 참가자들에게 전송
    else {
      // io.to(roomId).emit("fieldState", rooms[roomId].getFieldState());
    }
    console.log(
      `[socket server] disconnect result ${Object.keys(rooms).length}`
    );
  };

  socket.on("join", handleJoin);
  socket.on("changeDestination", handleChangeDestination);
  socket.on("disconnect", handleDisconnect);
});

const port = process.env.SOCKET_PORT || 5001;

httpServer.listen(port, () => {
  console.log(`** Raising Alien Creatures Socket Server **`);
  console.log(`App listening on port ${port}`);
});
