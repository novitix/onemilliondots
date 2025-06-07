package canvas

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

type canvas struct {
	Pixels []byte
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
		Width:  width,
		Height: height,
	}
	for i := range mainCanvas.Pixels {
		mainCanvas.Pixels[i] = 0b00010001 // 2 pixels per byte, initialise both pixels to 1.
	}

	return nil
}

func GetCanvas(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("Getting canvas\n")
	w.Header().Set("Content-Type", "application/octet-stream")
	start := time.Now()

	_, err := w.Write(mainCanvas.Pixels)

	elapsed := time.Since(start)
	log.Printf("Write took %s", elapsed)

	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting canvas: %s", err), http.StatusInternalServerError)
		return
	}
}

// i is the pixel position
// color should be a nibble (4 bits) colour
func SetPixel(i int, color byte) {
	fmt.Printf("Set pixel %d - Color %d\n", i, color)

	isPixelHigh := i%2 == 0
	bytePosition := i / 2

	if isPixelHigh {
		mainCanvas.Pixels[bytePosition] = (color << 4) | getLowNibble(mainCanvas.Pixels[bytePosition])
	} else {
		mainCanvas.Pixels[bytePosition] = getHighNibble(mainCanvas.Pixels[bytePosition])<<4 | color
	}
}
