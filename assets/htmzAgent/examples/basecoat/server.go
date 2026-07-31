package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func noCache(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		next.ServeHTTP(w, r)
	})
}

func errorFragment(slotID, msg string) string {
	return fmt.Sprintf(`<div id="%s" class="frag-error-wrap">
  <div class="frag-error-state">
    <span class="frag-error-icon">⚠</span>
    <span>%s</span>
  </div>
</div>`, slotID, msg)
}

func fragmentHandler(slotID, filePath string) http.HandlerFunc {
	return noCache(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	})).ServeHTTP
}

func main() {
	// Fragment routes with recover() wrapper — must be before catch-all
	http.HandleFunc("/fragments/dashboard.html", fragmentHandler("content-area", "fragments/dashboard.html"))
	http.HandleFunc("/fragments/hosts.html", fragmentHandler("content-area", "fragments/hosts.html"))

	http.Handle("/", noCache(http.FileServer(http.Dir("."))))

	http.HandleFunc("/api/host-detail", func(w http.ResponseWriter, r *http.Request) {
		host := r.URL.Query().Get("host")
		if host == "" {
			host = "N/A"
		}
		tmpl, err := os.ReadFile("fragments/host-detail.html")
		if err != nil {
			http.Error(w, "fragment not found", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/html")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		fmt.Fprintf(w, string(tmpl), host, host, host)
	})

	log.Println("Basecoat + htmz → http://localhost:8770")
	log.Fatal(http.ListenAndServe(":8770", nil))
}
