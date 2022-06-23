import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { IPosition, IConnectedPlayers } from "../../src/Interfaces";
import { arrayRemove } from "../../server/src/serverUtils";
import { SERVFAIL } from "dns";
import { SocketAddress } from "net";
const EVENTS = {
  connection: "connection",
  disconnect: "disconnect",
  CLIENT: {
    sendPosition: "sendPosition",
    livePosition: "livePosition",
  },
  SERVER: {
    connectionReceived: "connectionReceived",
    receivePosition: "receivePosition",
    connectedPlayersLivePosition: "connectedPlayersLivePosition",
  },
};
const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:1234",
    methods: ["GET", "POST"],
  },
});

app.get("/", (_, res) => res.send("Sever ist up ;)"));
httpServer.listen(3001, () => {
  console.log("server is running!");
});

let connectedPlayers: IConnectedPlayers[] = [];

io.on(EVENTS.connection, (socket: Socket) => {
  socket.on(EVENTS.disconnect, () => {
    const playerThatLeft = connectedPlayers.find(
      (player) => player.id === socket.id
    );
    if (playerThatLeft) {
      connectedPlayers = arrayRemove(connectedPlayers, playerThatLeft);
      socket.broadcast.emit(EVENTS.SERVER.receivePosition, connectedPlayers);
    }
  });
  socket.emit(EVENTS.SERVER.connectionReceived, socket.id); // client is connected, server asks for position

  socket.on(EVENTS.CLIENT.sendPosition, (position: IPosition) => {
    if (socket.id && position) {
      connectedPlayers.push({ id: socket.id, position: position });
    }
    socket.emit(EVENTS.SERVER.receivePosition, connectedPlayers);
    socket.broadcast.emit(EVENTS.SERVER.receivePosition, connectedPlayers);
  });
  socket.on(EVENTS.CLIENT.livePosition, (position: IPosition) => {
    /**look at the connectedPlayers array , find the one with the sender id and update its position*/
    connectedPlayers.forEach((connectedPlayer) => {
      if (connectedPlayer.id === socket.id) {
        connectedPlayer.position = position;
      }
    });
    socket.emit(EVENTS.SERVER.connectedPlayersLivePosition, connectedPlayers);
  });
});
