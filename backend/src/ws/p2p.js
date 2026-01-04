export function p2pConnection(io) {
  const nsp = io.of("/p2p");

  nsp.on("connection", socket => {
    console.log("🔌 P2P client connected:", socket.id);

    socket.on("join", ({ room }) => {
      socket.join(room);
    console.log(`📥 ${socket.id} joined room ${room}`);

      socket.to(room).emit("peer-joined");
    });

    socket.on("offer", data => {
      socket.to(data.room).emit("offer", data);
    });

    socket.on("answer", data => {
      socket.to(data.room).emit("answer", data);
    });

    socket.on("candidate", data => {
      socket.to(data.room).emit("candidate", data);
    });

    socket.on("disconnect", () => {
        console.log("❌ P2P client disconnected:", socket.id);
    });
  });
};
