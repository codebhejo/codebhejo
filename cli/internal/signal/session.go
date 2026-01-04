package signal

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type SessionResponse struct {
	Room string `json:"room"`
}

func CreateSession(api string) (string, error) {
	req, err := http.NewRequest("POST", api+"/p2p/session", bytes.NewBuffer(nil))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out SessionResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}

	return out.Room, nil
}
