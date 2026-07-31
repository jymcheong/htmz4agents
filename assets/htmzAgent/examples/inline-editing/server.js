const express = require('express');
const path = require('path');
const app = express();

const PORT = 8810;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// In-memory node state database
const nodeState = {
  hostname: 'PROD-SEC-NODE-01',
  environment: 'Production',
  email: 'security-ops@enterprise.com',
  cores: '16'
};

// ── GET Helper to render read-only display rows ──────────────────────────────
function renderDisplayRow(field, value) {
  let label = '';
  switch (field) {
    case 'hostname': label = 'Hostname'; break;
    case 'environment': label = 'Environment'; break;
    case 'email': label = 'Owner Email'; break;
    case 'cores': label = 'CPU Cores'; break;
  }

  // Format values nicely
  let displayVal = value;
  let valColorClass = 'text-default';
  if (field === 'environment') {
    if (value === 'Production') valColorClass = 'text-prod';
    else if (value === 'Staging') valColorClass = 'text-staging';
    else valColorClass = 'text-dev';
  }

  return `
    <div id="row-${field}" data-outcome="success" class="settings-row">
      <div class="row-info">
        <div class="row-label">${label}</div>
        <div class="row-value ${valColorClass}" id="val-${field}">${displayVal}</div>
      </div>
      <button class="btn-edit" onclick="editField('${field}')">
        Edit
      </button>
    </div>
  `;
}

// ── GET Helper to render editable form rows ──────────────────────────────────
function renderFormRow(field, value, errorMsg = '', isInvalid = false) {
  let label = '';
  let inputHtml = '';
  const errClass = isInvalid ? 'is-invalid' : '';

  switch (field) {
    case 'hostname':
      label = 'Hostname';
      inputHtml = `<input name="value" value="${value}" placeholder="e.g. PROD-SEC-NODE-01" class="input-control ${errClass}">`;
      break;
    case 'environment':
      label = 'Environment';
      inputHtml = `
        <select name="value" class="select-control ${errClass}">
          <option value="Production" ${value === 'Production' ? 'selected' : ''}>Production</option>
          <option value="Staging" ${value === 'Staging' ? 'selected' : ''}>Staging</option>
          <option value="Development" ${value === 'Development' ? 'selected' : ''}>Development</option>
        </select>
      `;
      break;
    case 'email':
      label = 'Owner Email';
      inputHtml = `<input name="value" type="email" value="${value}" placeholder="ops@company.com" class="input-control ${errClass}">`;
      break;
    case 'cores':
      label = 'CPU Cores';
      inputHtml = `<input name="value" type="number" min="1" max="128" value="${value}" placeholder="16" class="input-control ${errClass}">`;
      break;
  }

  const outcome = isInvalid ? 'invalid' : 'initial';

  return `
    <form id="row-${field}" data-outcome="${outcome}" action="/api/save/${field}#row-${field}" target="htmz" method="POST" class="settings-form">
      <div class="form-header">
        <label class="row-label">${label}</label>
        ${isInvalid ? `<span class="error-msg"><span>⚠</span> ${errorMsg}</span>` : ''}
      </div>
      <div class="input-group">
        ${inputHtml}
        <button type="submit" class="btn-save">
          Save
        </button>
        <button type="button" onclick="cancelEdit('${field}')" class="btn-cancel">
          Cancel
        </button>
      </div>
    </form>
  `;
}

// ── Serving index.html Statically ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── GET /api/edit/:field ─────────────────────────────────────────────────────
// Returns the editable form HTML fragment populated with the current value.
app.get('/api/edit/:field', (req, res) => {
  const { field } = req.params;
  if (!(field in nodeState)) {
    return res.status(404).send('Field not found');
  }

  const val = nodeState[field];
  console.log(`[SERVER] Rendering edit form for field: ${field} (value: ${val})`);
  res.send(renderFormRow(field, val));
});

// ── POST /api/save/:field ────────────────────────────────────────────────────
// Validates, updates the state, and returns either the display or error fragment.
app.post('/api/save/:field', (req, res) => {
  const { field } = req.params;
  let val = req.body.value;

  if (!(field in nodeState)) {
    return res.status(404).send('Field not found');
  }

  // Trim value if it's a string
  if (typeof val === 'string') {
    val = val.trim();
  }

  let errorMsg = '';
  let isInvalid = false;

  // Validation logic (Pattern 10 validation authority on server)
  if (field === 'hostname') {
    const hostnameRegex = /^[a-zA-Z0-9-]{3,20}$/;
    if (!val) {
      isInvalid = true;
      errorMsg = 'Hostname is required';
    } else if (!hostnameRegex.test(val)) {
      isInvalid = true;
      errorMsg = 'Must be 3-20 alphanumeric characters or hyphens';
    }
  } else if (field === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      isInvalid = true;
      errorMsg = 'Email is required';
    } else if (!emailRegex.test(val)) {
      isInvalid = true;
      errorMsg = 'Must be a valid email address';
    }
  } else if (field === 'cores') {
    const num = parseInt(val, 10);
    if (!val || isNaN(num) || num < 1 || num > 128) {
      isInvalid = true;
      errorMsg = 'Must be a number between 1 and 128';
    }
  } else if (field === 'environment') {
    const validEnvs = ['Production', 'Staging', 'Development'];
    if (!validEnvs.includes(val)) {
      isInvalid = true;
      errorMsg = 'Invalid environment selected';
    }
  }

  if (isInvalid) {
    console.warn(`[SERVER] Validation failed for field: ${field} (input: "${val}"). Error: ${errorMsg}`);
    // Return re-rendered form with error status (Pattern 10 - invalid)
    return res.send(renderFormRow(field, val, errorMsg, true));
  }

  // Update in-memory state on success
  nodeState[field] = val;
  console.log(`[SERVER] Field "${field}" updated successfully to: "${val}"`);

  // Return display fragment with success status (Pattern 10 - success)
  res.send(renderDisplayRow(field, val));
});

// ── Health/State endpoint for debug ──────────────────────────────────────────
app.get('/api/state', (req, res) => {
  res.json(nodeState);
});

app.listen(PORT, () => {
  console.log(`[P17 Server] Running at http://localhost:${PORT}/`);
  console.log(`[P17 Server] Press Ctrl+C to stop.`);
});
