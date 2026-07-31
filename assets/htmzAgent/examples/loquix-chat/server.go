package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func main() {
	_, src, _, _ := runtime.Caller(0)
	dir := filepath.Dir(src)

	loadDotEnv(filepath.Join(dir, ".env"))

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		log.Println("warning: ANTHROPIC_API_KEY not set — claude responses will fail")
	}

	fs := http.FileServer(http.Dir(dir))
	http.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, filepath.Join(dir, "loquixChat.html"))
			return
		}
		fs.ServeHTTP(w, r)
	}))

	// GET /suggestions#suggestions-panel — htmz fragment: suggested prompt chips
	http.HandleFunc("/suggestions", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, `<div id="suggestions-panel">
  <button class="chip" data-prompt="What is process baselining and why does it matter?">process baselining</button>
  <button class="chip" data-prompt="Explain lateral movement in two sentences">lateral movement</button>
  <button class="chip" data-prompt="What is a canary token and how does it work?">canary tokens</button>
  <button class="chip" data-prompt="Summarise the MITRE ATT&amp;CK framework in one paragraph">MITRE ATT&amp;CK</button>
</div>`)
	})

	// GET /stream?prompt=<encoded> — spawns claude -p, streams stdout as SSE
	http.HandleFunc("/stream", func(w http.ResponseWriter, r *http.Request) {
		prompt := r.URL.Query().Get("prompt")
		if prompt == "" {
			http.Error(w, "prompt required", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming not supported", http.StatusInternalServerError)
			return
		}

		send := func(line string) {
			fmt.Fprintf(w, "data: %s\n\n", strings.ReplaceAll(line, "\n", " "))
			flusher.Flush()
		}

		cmd := exec.CommandContext(r.Context(), "claude", "-p", prompt)
		if apiKey != "" {
			cmd.Env = append(os.Environ(), "ANTHROPIC_API_KEY="+apiKey)
		} else {
			cmd.Env = os.Environ()
		}

		stdout, err := cmd.StdoutPipe()
		if err != nil {
			send("[ERROR] " + err.Error())
			fmt.Fprintf(w, "data: [DONE]\n\n")
			flusher.Flush()
			return
		}
		if err := cmd.Start(); err != nil {
			send("[ERROR] " + err.Error())
			fmt.Fprintf(w, "data: [DONE]\n\n")
			flusher.Flush()
			return
		}

		buf := make([]byte, 64)
		for {
			n, readErr := stdout.Read(buf)
			if n > 0 {
				chunk := stripANSI(string(buf[:n]))
				encoded := strings.ReplaceAll(chunk, "\n", "\\n")
				if encoded != "" {
					fmt.Fprintf(w, "data: %s\n\n", encoded)
					flusher.Flush()
				}
			}
			if readErr != nil {
				break
			}
		}

		cmd.Wait()
		fmt.Fprintf(w, "data: [DONE]\n\n")
		flusher.Flush()
	})

	log.Println("listening → http://localhost:8760")
	log.Fatal(http.ListenAndServe(":8760", nil))
}

func stripANSI(s string) string {
	var b strings.Builder
	i := 0
	for i < len(s) {
		if s[i] == 0x1b && i+1 < len(s) && s[i+1] == '[' {
			i += 2
			for i < len(s) {
				c := s[i]
				i++
				if (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') {
					break
				}
			}
		} else {
			b.WriteByte(s[i])
			i++
		}
	}
	return b.String()
}

func loadDotEnv(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		os.Setenv(strings.TrimSpace(k), strings.TrimSpace(v))
	}
}
