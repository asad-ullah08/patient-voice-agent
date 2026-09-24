const express = require('express');
const router = express.Router();

const {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

const { handleVoiceWebhook } = require('../controllers/webhookController');

// REST API Endpoints
router.get('/patients', listPatients);
router.get('/patients/:id', getPatientById);
router.post('/patients', createPatient);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', deletePatient);

// Voice Agent Webhook Endpoint
router.post('/voice-webhook', handleVoiceWebhook);

// GET / (Visual Dashboard Bonus)
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CareCloud | Patient Intake Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #111827;
      --surface-border: #1f2937;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --badge-bg: rgba(59, 130, 246, 0.15);
      --badge-text: #60a5fa;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text-main);
      padding: 32px 24px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      background: linear-gradient(135deg, #2563eb, #38bdf8);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.5px;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    button {
      font-family: inherit;
      cursor: pointer;
      border: none;
      outline: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-refresh {
      background: var(--primary);
      color: white;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-refresh:hover { background: var(--primary-hover); }

    /* Stat Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 18px 20px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      margin-top: 6px;
      color: var(--text-main);
    }

    /* Filters / Search Bar */
    .controls {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .search-input {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      color: var(--text-main);
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      width: 320px;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--primary);
    }

    /* Table Container */
    .card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }

    th {
      background: #0d121f;
      padding: 14px 18px;
      font-weight: 600;
      color: #94a3b8;
      border-bottom: 1px solid var(--surface-border);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 16px 18px;
      border-bottom: 1px solid var(--surface-border);
      color: #e2e8f0;
    }

    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    .id-col {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--text-muted);
    }

    .badge {
      display: inline-block;
      background: var(--badge-bg);
      color: var(--badge-text);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state h3 {
      font-size: 16px;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    /* Modal for details */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      justify-content: center;
      align-items: center;
      z-index: 100;
    }

    .modal {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      width: 520px;
      max-width: 90vw;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--surface-border);
      padding-bottom: 12px;
    }

    .modal-header h2 { font-size: 18px; }
    .close-btn { background: none; color: var(--text-muted); font-size: 20px; cursor: pointer; }
    .modal-field { margin-bottom: 12px; font-size: 13px; }
    .modal-field strong { color: #94a3b8; display: inline-block; width: 140px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo-badge">CareCloud</div>
        <div>
          <h1>Voice AI Patient Intake</h1>
          <div class="subtitle">Live persistent registry driven by conversational AI agent</div>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" onclick="loadPatients()">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh Feed
        </button>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Registered Patients</div>
        <div class="stat-value" id="stat-total">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Telephony Source</div>
        <div class="stat-value" style="font-size: 20px; margin-top: 12px; color: #38bdf8;">Vapi / US Line</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Persistence Engine</div>
        <div class="stat-value" style="font-size: 20px; margin-top: 12px; color: #10b981;">SQLite 3 Disk</div>
      </div>
    </div>

    <div class="controls">
      <input type="text" id="searchInput" class="search-input" placeholder="Search by name, phone, or state..." onkeyup="filterPatients()" />
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>DOB</th>
            <th>Sex</th>
            <th>Phone</th>
            <th>Location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="patientList">
          <tr>
            <td colspan="7" class="empty-state">Loading records...</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Detail Modal -->
  <div class="modal-overlay" id="modalOverlay" onclick="closeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h2 id="modalName">Patient Details</h2>
        <button class="close-btn" onclick="closeModal()">&times;</button>
      </div>
      <div id="modalContent"></div>
    </div>
  </div>

  <script>
    let patientsData = [];

    async function loadPatients() {
      try {
        const res = await fetch('/patients');
        const json = await res.json();
        patientsData = json.data || [];
        document.getElementById('stat-total').innerText = patientsData.length;
        renderTable(patientsData);
      } catch (err) {
        document.getElementById('patientList').innerHTML = \`
          <tr><td colspan="7" class="empty-state" style="color:#ef4444;">Failed to connect to /patients endpoint.</td></tr>
        \`;
      }
    }

    function renderTable(list) {
      const tbody = document.getElementById('patientList');
      if (list.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="7" class="empty-state">
              <h3>No Patients Found</h3>
              <p>Dial your Vapi number to register a patient through the AI intake agent.</p>
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = list.map(p => \`
        <tr>
          <td class="id-col">\${p.patient_id.substring(0, 8)}...</td>
          <td><strong>\${escapeHtml(p.first_name)} \${escapeHtml(p.last_name)}</strong></td>
          <td>\${escapeHtml(p.date_of_birth)}</td>
          <td><span class="badge">\${escapeHtml(p.sex)}</span></td>
          <td>\${escapeHtml(p.phone_number)}</td>
          <td>\${escapeHtml(p.city)}, \${escapeHtml(p.state)} \${escapeHtml(p.zip_code)}</td>
          <td>
            <button style="background:#1f2937; color:#38bdf8; padding:6px 12px; font-size:12px;" onclick='openModal(\${JSON.stringify(p)})'>
              View Full
            </button>
          </td>
        </tr>
      \`).join('');
    }

    function filterPatients() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      const filtered = patientsData.filter(p => 
        \`\${p.first_name} \${p.last_name}\`.toLowerCase().includes(query) ||
        p.phone_number.includes(query) ||
        p.state.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
      );
      renderTable(filtered);
    }

    function openModal(p) {
      document.getElementById('modalName').innerText = \`\${p.first_name} \${p.last_name}\`;
      document.getElementById('modalContent').innerHTML = \`
        <div class="modal-field"><strong>Full ID:</strong> <span style="font-family:monospace;">\${p.patient_id}</span></div>
        <div class="modal-field"><strong>Date of Birth:</strong> \${p.date_of_birth}</div>
        <div class="modal-field"><strong>Sex:</strong> \${p.sex}</div>
        <div class="modal-field"><strong>Phone:</strong> \${p.phone_number}</div>
        <div class="modal-field"><strong>Email:</strong> \${p.email || 'N/A'}</div>
        <div class="modal-field"><strong>Address:</strong> \${p.address_line_1}\${p.address_line_2 ? ', ' + p.address_line_2 : ''}, \${p.city}, \${p.state} \${p.zip_code}</div>
        <div class="modal-field"><strong>Insurance:</strong> \${p.insurance_provider || 'None'} \${p.insurance_member_id ? '(' + p.insurance_member_id + ')' : ''}</div>
        <div class="modal-field"><strong>Language:</strong> \${p.preferred_language || 'English'}</div>
        <div class="modal-field"><strong>Emergency Contact:</strong> \${p.emergency_contact_name || 'N/A'} \${p.emergency_contact_phone ? '(' + p.emergency_contact_phone + ')' : ''}</div>
        <div class="modal-field"><strong>Registered:</strong> \${new Date(p.created_at).toLocaleString()}</div>
      \`;
      document.getElementById('modalOverlay').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('modalOverlay').style.display = 'none';
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    loadPatients();
  </script>
</body>
</html>
  `);
});

module.exports = router;