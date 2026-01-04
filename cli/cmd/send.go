package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	osSignal "os/signal"
	"syscall"
	"time"

	"github.com/pion/webrtc/v3"
	"github.com/spf13/cobra"

	"gitlab.com/9ovindyadav/codefile/cli/internal/config"
	signalpkg "gitlab.com/9ovindyadav/codefile/cli/internal/signal"
	webrtcpeer "gitlab.com/9ovindyadav/codefile/cli/internal/webrtc"
)

var sendCmd = &cobra.Command{
	Use:   "send <file>",
	Short: "Send a file via WebRTC",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		filePath := args[0]

		room, err := signalpkg.CreateSession(config.API)
		if err != nil {
			return err
		}

		fmt.Println("📦 File:", filePath)
		fmt.Println("🔗 Room:", room)
		fmt.Printf("🌐 Share link: %s/d/%s\n", config.WEB_URL, room)

		socket, err := signalpkg.Connect(config.API)
		if err != nil {
			return err
		}

		var peer *webrtcpeer.Peer

		cleanupPeer := func() {
			if peer != nil {
				fmt.Println("🧹 Closing previous peer")
				peer.Channel.Close()
				peer.PC.Close()
				peer = nil
			}
		}

		setupPeerAndSend := func() (*webrtcpeer.Peer, error) {
			p, err := webrtcpeer.NewSenderPeer(func(c *webrtc.ICECandidateInit) {
				socket.Emit("candidate", map[string]any{
					"room":      room,
					"candidate": c,
				})
			})
			if err != nil {
				return nil, err
			}

			p.Channel.OnOpen(func() {

				go func() {
					err := webrtcpeer.SendFile(p.Channel, filePath)
					if err != nil {
						fmt.Println("❌ File send error:", err)
					}
				}()
			})

			return p, nil
		}

		socket.On("connect", func(_ ...any) {
			socket.Emit("join", map[string]string{"room": room})
		})

		socket.On("peer-joined", func(_ ...any) {

			cleanupPeer()

			var err error
			peer, err = setupPeerAndSend()
			if err != nil {
				fmt.Println("❌ Error creating peer:", err)
				return
			}

			sdp, err := peer.CreateOffer()
			if err != nil {
				fmt.Println("❌ Error creating offer:", err)
				return
			}

			socket.Emit("offer", map[string]any{
				"room": room,
				"sdp":  sdp,
			})
		})

		socket.On("answer", func(args ...any) {
			if peer == nil {
				return
			}
			data := args[0].(map[string]any)
			sdp := data["sdp"].(string)
			err := peer.SetAnswer(sdp)
			if err != nil {
				fmt.Println("❌ Error setting answer:", err)
			}
		})

		socket.On("candidate", func(args ...any) {
			if peer == nil {
				return
			}
			data := args[0].(map[string]any)
			c := data["candidate"].(map[string]any)
			bytes, _ := json.Marshal(c)
			var ci webrtc.ICECandidateInit
			json.Unmarshal(bytes, &ci)
			peer.PC.AddICECandidate(ci)
		})

		socket.On("disconnect", func(args ...any) {
			fmt.Println("🔌 Disconnected:", args)
		})

		waitForExit(cleanupPeer)
		return nil
	},
}

func waitForExit(cleanup func()) {
	ch := make(chan os.Signal, 1)
	osSignal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
	<-ch
	fmt.Println("\n👋 Closing sender")
	cleanup()
	time.Sleep(200 * time.Millisecond)
}
