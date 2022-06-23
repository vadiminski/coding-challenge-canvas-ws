import "./styles.css";
import { IPosition, IConnectedPlayers } from "./Interfaces";
import { getRandomIntInclusive } from "./utils";
import { io } from "socket.io-client";
const EVENTS = {
  connection: "connection",
  disconnect: "disconnect",
  CLIENT: {
    sendStartingPosition: "sendStartingPosition",
    livePosition: "livePosition",
  },
  SERVER: {
    connectionReceived: "connectionReceived",
    connectedPlayers: "connectedPlayers",
    connectedPlayersLivePosition: "connectedPlayersLivePosition",
  },
};
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
ctx.fillStyle = "black";

const start: IPosition = {
  x: getRandomIntInclusive(0, 400),
  y: getRandomIntInclusive(0, 300),
};
let position: IPosition = start;

let direction: "left" | "top" | "right" | "down";

const size: { x: number; y: number } = { x: 5, y: 5 };

const socket = io("ws://localhost:3001");
const activateListeners = () => {
  socket.on(EVENTS.SERVER.connectionReceived, () => {
    socket.emit(EVENTS.CLIENT.sendStartingPosition, start);
  });
  socket.on(
    EVENTS.SERVER.connectedPlayers,
    (connectedPlayers: IConnectedPlayers[]) => {
      ctx.clearRect(0, 0, 400, 300);
      connectedPlayers.forEach((connectedPlayer: IConnectedPlayers) => {
        ctx.fillRect(
          connectedPlayer.position.x,
          connectedPlayer.position.y,
          size.x,
          size.y
        );
      });
    }
  );
  socket.on(
    EVENTS.SERVER.connectedPlayersLivePosition,
    (connectedPlayers: IConnectedPlayers[]) => {
      ctx.clearRect(0, 0, 400, 300);
      connectedPlayers.forEach((connectedPlayer: IConnectedPlayers) => {
        ctx.fillRect(
          connectedPlayer.position.x,
          connectedPlayer.position.y,
          size.x,
          size.y
        );
      });
    }
  );
};

window.addEventListener("keydown", (e) => {
  if (e.repeat) {
    return;
  }

  if (e.key === "ArrowUp") {
    direction = "top";
  } else if (e.key === "ArrowDown") {
    direction = "down";
  } else if (e.key === "ArrowLeft") {
    direction = "left";
  } else if (e.key === "ArrowRight") {
    direction = "right";
  }
});

let gameloopI: number;
function gameLoop() {
  socket.emit(EVENTS.CLIENT.livePosition, position);
  /**emit object {player id, position} to the server. the server overwrites the position every time it receives
   * a new position from the same id. server broadcasts the complete array to all connected players. on receiving the array,
   * the client renders
   */
  // ctx.clearRect(0, 0, 400, 300);
  // ctx.fillRect(position.x, position.y, size.x, size.y);

  switch (direction) {
    case "down":
      position.y += 1;
      break;
    case "left":
      position.x -= 1;
      break;
    case "right":
      position.x += 1;
      break;
    case "top":
      position.y -= 1;
      break;
  }
  // Rerender
  if (position.y < 0) {
    direction = "down";
  }
  if (position.y > canvas.height - size.y) {
    direction = "top";
  }
  if (position.x < 0) {
    direction = "right";
  }
  if (position.x > canvas.width - size.x) {
    direction = "left";
  }

  gameloopI = window.requestAnimationFrame(gameLoop);
}
activateListeners();
gameLoop();

window.addEventListener("unload", () => {
  window.cancelAnimationFrame(gameloopI);
});
