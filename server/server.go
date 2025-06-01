package main

import (
	"canvas/canvas"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

const WIDTH = 300
const HEIGHT = 300


func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func getRoot(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / request\n")
	io.WriteString(w, "Canvas server up!\n")
}

type CanvasPost struct {
	I      int
	Colour byte
}

func handleCanvas(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodGet {
		canvas.GetCanvas(w, r)
	} else if r.Method == http.MethodPost {
		var canvasPost CanvasPost
		err := json.NewDecoder(r.Body).Decode(&canvasPost)
		if err != nil {
			fmt.Printf("Error decoding canvas post: %s\n", err)
			return
		}
		fmt.Printf("got canvas post: %v\n", canvasPost)
		canvas.SetPixel(canvasPost.I, canvasPost.Colour)

	}
}

func main() {
	canvas.InitCanvas(HEIGHT, WIDTH)

	http.HandleFunc("/", getRoot)
	http.HandleFunc("/canvas", handleCanvas)

	err := http.ListenAndServe(":3333", nil)
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
