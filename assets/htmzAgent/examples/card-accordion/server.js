const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/rescan', (req, res) => {
  const { host } = req.body;
  const jobId = 'rsn_' + Math.random().toString(36).slice(2, 9);
  res.send(`
    <div class="modal-status success">
      <div class="modal-status-dot"></div>
      <span>Rescan queued for ${host} — job_id: ${jobId}</span>
    </div>
  `);
});

app.post('/api/notify', (req, res) => {
  const { host, recipient } = req.body;
  const jobId = 'ntf_' + Math.random().toString(36).slice(2, 9);
  res.send(`
    <div class="modal-status success">
      <div class="modal-status-dot"></div>
      <span>Notified ${recipient} for ${host} — job_id: ${jobId}</span>
    </div>
  `);
});

app.listen(8743, () => console.log('http://localhost:8743'));
