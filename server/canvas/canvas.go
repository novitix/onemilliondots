package canvas

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const WAIT_BEFORE_CLEAR = 1500 // ms - should be longer than the client refetch interval
const CONSOLIDATE_INTERVAL = 5000 // ms - how often to consolidate edits

type Edit struct {
	Uuid   string
	I      int
	Colour byte
}

type canvas struct {
	Pixels []byte
	Edits  []Edit
	Width  int
	Height int
}

var mainCanvas canvas

func getHighNibble(bits byte) byte {
	return bits >> 4
}

func getLowNibble(bits byte) byte {
	return bits & 0b00001111
}

func InitCanvas(height int, width int) error {
	if (height*width)%2 != 0 {
		return fmt.Errorf("number of pixels (height*width) is not even: %d x %d", height, width)
	}

	mainCanvas = canvas{
		Pixels: make([]byte, height*width/2),
		Edits:  make([]Edit, 0),
		Width:  width,
		Height: height,
	}
	for i := range mainCanvas.Pixels {
		mainCanvas.Pixels[i] = 0b11111111 // 2 pixels per byte, initialise both pixels to 15.
	}

	go startConsolidation()
	return nil
}

func GetFullCanvas(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("Getting full canvas\n")

	w.Header().Set("Content-Type", "application/octet-stream")
	_, err := w.Write(mainCanvas.Pixels)

	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting canvas: %s", err), http.StatusInternalServerError)
		return
	}
}

func GetEdits(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	content, marshalErr := json.Marshal(mainCanvas.Edits)
	if marshalErr != nil {
		http.Error(w, fmt.Sprintf("Error getting edits: %s", marshalErr), http.StatusInternalServerError)
	}

	_, writeErr := w.Write(content)
	if writeErr != nil {
		http.Error(w, fmt.Sprintf("Error getting canvas: %s", writeErr), http.StatusInternalServerError)
	}
}

// i is the pixel position
// color should be between 0-15
func CreateEdit(uuid string, i int, color byte) {
	fmt.Printf("Set pixel %d - Color %d\n", i, color)
	mainCanvas.Edits = append(mainCanvas.Edits, Edit{
		Uuid:   uuid,
		I:      i,
		Colour: color,
	})
}

func startConsolidation() {
	for range time.Tick(CONSOLIDATE_INTERVAL * time.Millisecond) {
		consolidateEdits()
	}
}

func consolidateEdits() {
	for _, edit := range mainCanvas.Edits {
		isPixelHigh := edit.I%2 == 0
		bytePosition := edit.I / 2

		if isPixelHigh {
			mainCanvas.Pixels[bytePosition] = (edit.Colour << 4) | getLowNibble(mainCanvas.Pixels[bytePosition])
		} else {
			mainCanvas.Pixels[bytePosition] = getHighNibble(mainCanvas.Pixels[bytePosition])<<4 | edit.Colour
		}
	}

	// Ensure all users have received the latest edits before clearing
	count := len(mainCanvas.Edits)
	if count <= 0 || count > len(mainCanvas.Edits) {
		return
	}
	
	time.Sleep((WAIT_BEFORE_CLEAR) * time.Millisecond)

	mainCanvas.Edits = mainCanvas.Edits[count:] // Clear the edits that have been consolidated
	fmt.Printf("Consolidated and cleared %d edits\n", count)
}
