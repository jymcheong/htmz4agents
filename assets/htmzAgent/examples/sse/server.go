package main

import (
	"bufio"
	"fmt"
	"html"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

type task struct {
	display string
	args    []string
}

var tasks = map[string]task{
	"ps":      {display: "ps aux", args: []string{"ps", "aux"}},
	"disk":    {display: "df -h", args: []string{"df", "-h"}},
	"git-log": {display: "git log · Alfred", args: []string{"git", "-C", "/Users/q/github/Alfred", "log", "--oneline", "-20"}},
	"claude":  {display: "claude -p · process baselining", args: []string{"claude", "-p", "summarise what process baselining means in one paragraph"}},
}

func main() {
	_, src, _, _ := runtime.Caller(0)
	dir := filepath.Dir(src)

	loadDotEnv(filepath.Join(dir, ".env"))

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		log.Println("warning: ANTHROPIC_API_KEY not set — claude task will fail")
	}

	fs := http.FileServer(http.Dir(dir))
	http.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, filepath.Join(dir, "taskRunner.html"))
			return
		}
		fs.ServeHTTP(w, r)
	}))

	// POST /header?task=<name>#output-panel — htmz fragment: task header + empty trace body
	http.HandleFunc("/header", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST only", http.StatusMethodNotAllowed)
			return
		}
		name := r.URL.Query().Get("task")
		t, ok := tasks[name]
		if !ok {
			http.Error(w, "unknown task", http.StatusBadRequest)
			return
		}
		ts := time.Now().Format("15:04:05")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w,
			`<div id="output-panel">`+
				`<div class="task-header">`+
				`<span class="task-name">%s</span>`+
				`<span class="task-ts">%s</span>`+
				`</div>`+
				`<pre id="trace-body" data-task="%s"><span class="spinner"></span></pre>`+
				`</div>`,
			html.EscapeString(t.display),
			html.EscapeString(ts),
			html.EscapeString(name),
		)
	})

	// GET /run?task=<name> — stream stdout line-by-line as SSE; [DONE] sentinel at end
	http.HandleFunc("/run", func(w http.ResponseWriter, r *http.Request) {
		name := r.URL.Query().Get("task")
		t, ok := tasks[name]
		if !ok {
			http.Error(w, "unknown task", http.StatusBadRequest)
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

		sendLine := func(line string) {
			fmt.Fprintf(w, "data: %s\n\n", strings.ReplaceAll(line, "\n", " "))
			flusher.Flush()
		}

		cmd := exec.CommandContext(r.Context(), t.args[0], t.args[1:]...)
		if apiKey != "" {
			cmd.Env = append(os.Environ(), "ANTHROPIC_API_KEY="+apiKey)
		} else {
			cmd.Env = os.Environ()
		}

		stdout, err := cmd.StdoutPipe()
		if err != nil {
			sendLine("[ERROR] " + err.Error())
			fmt.Fprintf(w, "data: [DONE]\n\n")
			flusher.Flush()
			return
		}
		if err := cmd.Start(); err != nil {
			sendLine("[ERROR] " + err.Error())
			fmt.Fprintf(w, "data: [DONE]\n\n")
			flusher.Flush()
			return
		}

		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := stripANSI(scanner.Text())
			sendLine(line)
		}

		cmd.Wait()
		fmt.Fprintf(w, "data: [DONE]\n\n")
		flusher.Flush()
	})

	log.Println("listening → http://localhost:8750")
	log.Fatal(http.ListenAndServe(":8750", nil))
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
