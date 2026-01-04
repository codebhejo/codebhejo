package cmd

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pion/webrtc/v3"
	"github.com/spf13/cobra"

	"gitlab.com/9ovindyadav/codefile/cli/internal/config"
	signalpkg "gitlab.com/9ovindyadav/codefile/cli/internal/signal"
	webrtcpeer "gitlab.com/9ovindyadav/codefile/cli/internal/webrtc"
)

var receiveCmd = &cobra.Command{
	Use:   "receive <room>",
	Short: "Receive a shared file",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {

		room, err := parseRoom(args[0])
		if err != nil {
			return err
		}

		fmt.Println("🔗 Joining room:", room)

		socket, err := signalpkg.Connect(config.API)
		if err != nil {
			return err
		}

		transferStarted := make(chan struct{}, 1)
		signalStarted := func() {
			select {
			case transferStarted <- struct{}{}:
			default:
			}
		}

		var (
			peer     *webrtcpeer.Peer
			file     *os.File
			fileSize int64
			received int64
		)

		peer, err = webrtcpeer.NewReceiverPeer(func(c *webrtc.ICECandidateInit) {
			socket.Emit("candidate", map[string]any{
				"room":      room,
				"candidate": c,
			})
		})
		if err != nil {
			return err
		}

		peer.PC.OnDataChannel(func(dc *webrtc.DataChannel) {
			signalStarted()

			peer.Channel = dc

			dc.SetBufferedAmountLowThreshold(256 * 1024)

			dc.OnMessage(func(msg webrtc.DataChannelMessage) {

				if msg.IsString {
					var meta map[string]any
					if err := json.Unmarshal(msg.Data, &meta); err != nil {
						fmt.Println("❌ Invalid metadata")
						return
					}

					if meta["type"] == "meta" {
						signalStarted()

						filename := meta["name"].(string)
						fileSize = int64(meta["size"].(float64))

						path := filepath.Join(".", filename)
						f, err := os.Create(path)
						if err != nil {
							fmt.Println("❌ Cannot create file:", err)
							return
						}

						file = f
						fmt.Printf("📦 Receiving: %s size: %d\n", filename, fileSize)
					}
					return
				}

				if file != nil {
					n, _ := file.Write(msg.Data)
					received += int64(n)

					progress := float64(received) / float64(fileSize) * 100
					fmt.Printf("\r📥 Receiving: %.1f%%", progress)

					if received >= fileSize {
						fmt.Println("\n✅ File received successfully")

						file.Close()
						file = nil

						peer.Channel.Close()
						peer.PC.Close()
						socket.Close()
						os.Exit(0)
					}
				}
			})
		})

		socket.On("connect", func(_ ...any) {
			socket.Emit("join", map[string]string{"room": room})
		})

		socket.On("offer", func(args ...any) {
			data := args[0].(map[string]any)
			sdp := data["sdp"].(string)

			if err := peer.PC.SetRemoteDescription(webrtc.SessionDescription{
				Type: webrtc.SDPTypeOffer,
				SDP:  sdp,
			}); err != nil {
				fmt.Println("❌ SetRemoteDescription failed:", err)
				return
			}

			answer, err := peer.PC.CreateAnswer(nil)
			if err != nil {
				fmt.Println("❌ CreateAnswer failed:", err)
				return
			}

			if err := peer.PC.SetLocalDescription(answer); err != nil {
				fmt.Println("❌ SetLocalDescription failed:", err)
				return
			}

			socket.Emit("answer", map[string]any{
				"room": room,
				"sdp":  answer.SDP,
			})
		})

		socket.On("candidate", func(args ...any) {
			data := args[0].(map[string]any)
			raw := data["candidate"]
			b, _ := json.Marshal(raw)

			var ci webrtc.ICECandidateInit
			if err := json.Unmarshal(b, &ci); err == nil {
				peer.PC.AddICECandidate(ci)
			}
		})

		// ⏱ Timeout watchdog
		go func() {
			select {
			case <-transferStarted:
				return
			case <-time.After(10 * time.Second):
				fmt.Println("❌ Sender has stopped sharing the file")
				peer.PC.Close()
				socket.Close()
				os.Exit(1)
			}
		}()

		select {}
	},
}

func parseRoom(input string) (string, error) {

	if strings.HasPrefix(input, "http://") || strings.HasPrefix(input, "https://") {
		u, err := url.Parse(input)
		if err != nil {
			return "", fmt.Errorf("invalid URL")
		}

		segments := strings.Split(strings.Trim(u.Path, "/"), "/")

		if len(segments) == 2 && segments[0] == "d" {
			return segments[1], nil
		} else {
			return "", fmt.Errorf("invalid Codebhejo URL")
		}
	}

	return input, nil
}
