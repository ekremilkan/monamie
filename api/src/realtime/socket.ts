import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

type InitOptions = {
  allowedOrigins: string[];
};

export const initializeSocketServer = (
  server: HttpServer,
  options: InitOptions
) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: options.allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    socket.on("join:order", (orderId: number) => {
      if (!orderId) return;
      socket.join(getOrderRoom(orderId));
    });

    socket.on("leave:order", (orderId: number) => {
      if (!orderId) return;
      socket.leave(getOrderRoom(orderId));
    });

    socket.on("join:user", (userId: number) => {
      if (!userId) return;
      socket.join(getUserRoom(userId));
    });

    socket.on("leave:user", (userId: number) => {
      if (!userId) return;
      socket.leave(getUserRoom(userId));
    });
  });

  return io;
};

const getOrderRoom = (orderId: number) => `order:${orderId}`;
const getUserRoom = (userId: number) => `user:${userId}`;

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io server is not initialised yet.");
  }
  return io;
};

type OrderStatusEvent = {
  id: number;
  status: string;
  userId: number;
  totalPrice?: string | number;
  updatedAt?: string;
};

export const broadcastOrderStatus = (order: OrderStatusEvent) => {
  const server = getIO();
  const payload = {
    orderId: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    updatedAt: order.updatedAt ?? new Date().toISOString(),
  };
  server.to(getOrderRoom(order.id)).emit("order:status", payload);
  server.to(getUserRoom(order.userId)).emit("order:status", payload);
};
