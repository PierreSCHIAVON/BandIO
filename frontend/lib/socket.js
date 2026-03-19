import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io("https://band-io-back.vercel.app/", {
      transports: ["websocket"],
    });
  }
  return socket;
}
