package canvas

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type canvas struct {
	Pixels []byte
	Width  int
	Height int
}

var myCanvas canvas

func InitCanvas(height int, width int) {
	myCanvas = canvas{
		Pixels: make([]byte, height*width),
		Width:  width,
		Height: height,
	}
	var green byte = 0
	fmt.Print(green)
	for i := range myCanvas.Pixels {
		myCanvas.Pixels[i] = 1 //byte(i % 255)
	}
}

func GetCanvas(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("Getting canvas\n")
	// canvasJson, err := json.Marshal(&myCanvas)
	// if err != nil {
	// 	fmt.Printf("Error marshalling canvas: %s\n", err)
	// 	return
	// }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(myCanvas)
}

func SetPixel(i int, color byte) {
	myCanvas.Pixels[i] = color
}
