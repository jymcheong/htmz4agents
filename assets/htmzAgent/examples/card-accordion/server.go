package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"
)

func randID() string {
	return fmt.Sprintf("%07x", rand.Intn(0xfffffff))
}

func errorFragment(slotID, msg string) string {
	return fmt.Sprintf(`<div id="%s" class="error-card">
	<div class="card-body">
		<div class="error-state">
			<span class="error-icon">⚠</span>
			<span>%s</span>
		</div>
	</div>
</div>`, slotID, msg)
}

func fragmentHandler(slotID, filePath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		defer func() {
			if rec := recover(); rec != nil {
				fmt.Fprint(w, errorFragment(slotID, fmt.Sprintf("panic: %v", rec)))
			}
		}()
		content, err := os.ReadFile(filePath)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, errorFragment(slotID, "fragment unavailable"))
			return
		}
		w.Write(content)
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// Fragment routes — recover() wrapper ensures error fragment always returned
	http.HandleFunc("/fragments/host-001-card.html", fragmentHandler("card-container", "fragments/host-001-card.html"))
	http.HandleFunc("/fragments/host-002-card.html", fragmentHandler("host-002-card", "fragments/host-002-card.html"))
	http.HandleFunc("/fragments/host-003-card.html", fragmentHandler("host-003-card", "fragments/host-003-card.html"))

	// Catch-all static file server
	http.Handle("/", http.FileServer(http.Dir(".")))

	http.HandleFunc("/api/rescan", func(w http.ResponseWriter, r *http.Request) {
		var body struct{ Host string }
		json.NewDecoder(r.Body).Decode(&body)
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
		<div class="modal-status success">
			<div class="modal-status-dot"></div>
			<span>Rescan queued for %s — job_id: rsn_%s</span>
		</div>`, body.Host, randID())
	})

	http.HandleFunc("/api/notify", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Host      string
			Recipient string
		}
		json.NewDecoder(r.Body).Decode(&body)
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
		<div class="modal-status success">
			<div class="modal-status-dot"></div>
			<span>Notified %s for %s — job_id: ntf_%s</span>
		</div>`, body.Recipient, body.Host, randID())
	})

	http.HandleFunc("/error-sim", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		if rand.Intn(2) == 0 {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `
			<div class="modal-status error">
				<div class="modal-status-dot"></div>
				<span>500 Internal Server Error — backend failure simulated</span>
			</div>`)
		} else {
			fmt.Fprintf(w, `
			<div class="modal-status success">
				<div class="modal-status-dot"></div>
				<span>Backend healthy — launching triage…</span>
			</div>`)
		}
	})

	log.Println("http://localhost:8743")
	log.Fatal(http.ListenAndServe(":8743", nil))
}
