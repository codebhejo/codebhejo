package webrtcpeer

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/pion/webrtc/v3"
)

const chunkSize = 32 * 1024 // smaller chunk size for safe cross-platform
const maxBufferedAmount = 512 * 1024

func SendFile(dc *webrtc.DataChannel, path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	info, _ := file.Stat()

	meta := map[string]any{
		"type": "meta",
		"name": info.Name(),
		"size": info.Size(),
	}

	metaBytes, _ := json.Marshal(meta)
	dc.SendText(string(metaBytes))

	buf := make([]byte, chunkSize)
	var sent int64

	for {
		for dc.BufferedAmount() > maxBufferedAmount {
			time.Sleep(10 * time.Millisecond)
		}

		n, err := file.Read(buf)
		if n > 0 {

			for dc.BufferedAmount() > 256*1024 { // 256 KB threshold
				time.Sleep(20 * time.Millisecond)
			}

			err2 := dc.Send(buf[:n])
			if err2 != nil {
				return err2
			}

			sent += int64(n)
			progress := float64(sent) / float64(info.Size()) * 100
			fmt.Printf("\r📤 Sending: %.1f%%", progress)
		}
		if err != nil {
			break
		}
	}

	fmt.Println("\n📦 File sent")
	return nil
}
