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

const WIDTH = 1000
const HEIGHT = 1000

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func getRoot(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got / request\n")
	if r.URL.Path != "/" {
		w.WriteHeader(http.StatusNotFound)
	} else {
		io.WriteString(w, "Canvas server up!\n")
	}
}

func handleCanvasFull(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodGet {
		canvas.GetFullCanvas(w, r)
		return
	}

	w.WriteHeader(http.StatusNotFound)
}

func handleCanvasEdits(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodGet {
		canvas.GetEdits(w, r)
		return
	}

	if r.Method == http.MethodPost {
		var canvasPost canvas.Edit
		err := json.NewDecoder(r.Body).Decode(&canvasPost)
		if err != nil {
			fmt.Printf("Error decoding canvas post: %s", err)
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, "%s\n", err)
			return
		}
		canvas.CreateEdit(canvasPost.Uuid, canvasPost.I, canvasPost.Colour)
		return
	}

	w.WriteHeader(http.StatusNotFound)
}

func main() {
	canvas.InitCanvas(HEIGHT, WIDTH)

	http.HandleFunc("/", getRoot)
	http.HandleFunc("/canvas/full", handleCanvasFull)
	http.HandleFunc("/canvas/edits", handleCanvasEdits)

	err := http.ListenAndServe(":1234", nil)
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
