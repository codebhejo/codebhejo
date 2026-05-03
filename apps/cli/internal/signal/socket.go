package signal

import (
	socketio "github.com/zishang520/socket.io/clients/socket/v3"
)

func Connect(api string) (*socketio.Socket, error) {
	manager := socketio.NewManager(api, &socketio.ManagerOptions{})

	socket := manager.Socket("/p2p", &socketio.SocketOptions{})
	return socket, nil
}
