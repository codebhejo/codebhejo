package webrtcpeer

import (
	"encoding/json"
	"fmt"

	"github.com/pion/webrtc/v3"
)

type Peer struct {
	PC      *webrtc.PeerConnection
	Channel *webrtc.DataChannel
}

func NewSenderPeer(onICE func(*webrtc.ICECandidateInit)) (*Peer, error) {
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
	}

	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return nil, err
	}

	peer := &Peer{PC: pc}

	// Data channel
	channel, err := pc.CreateDataChannel("file", nil)
	if err != nil {
		return nil, err
	}
	peer.Channel = channel

	channel.OnOpen(func() {
		fmt.Println("✅ DataChannel open")
	})

	channel.OnError(func(err error) {

	})

	// ICE candidates
	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		ci := c.ToJSON()
		onICE(&ci)
	})

	return peer, nil
}

func (p *Peer) CreateOffer() (string, error) {
	offer, err := p.PC.CreateOffer(nil)
	if err != nil {
		return "", err
	}

	err = p.PC.SetLocalDescription(offer)
	if err != nil {
		return "", err
	}

	return offer.SDP, nil
}

func (p *Peer) SetAnswer(sdp string) error {
	return p.PC.SetRemoteDescription(webrtc.SessionDescription{
		Type: webrtc.SDPTypeAnswer,
		SDP:  sdp,
	})
}

func Encode(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func NewReceiverPeer(onICE func(*webrtc.ICECandidateInit)) (*Peer, error) {
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
	}

	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return nil, err
	}

	peer := &Peer{PC: pc}

	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		fmt.Println("✅ DataChannel opened:", dc.Label())

		peer.Channel = dc

		dc.SetBufferedAmountLowThreshold(256 * 1024)

		dc.OnBufferedAmountLow(func() {

		})

		dc.OnOpen(func() {
			fmt.Println("📡 DataChannel ready to receive")
		})

		dc.OnError(func(err error) {
			fmt.Println("❌ DataChannel error:", err)
		})
	})

	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		ci := c.ToJSON()
		onICE(&ci)
	})

	return peer, nil
}

func (p *Peer) SetOffer(sdp string) error {
	return p.PC.SetRemoteDescription(webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  sdp,
	})
}

func (p *Peer) CreateAnswer() (string, error) {
	answer, err := p.PC.CreateAnswer(nil)
	if err != nil {
		return "", err
	}

	err = p.PC.SetLocalDescription(answer)
	if err != nil {
		return "", err
	}

	return answer.SDP, nil
}
