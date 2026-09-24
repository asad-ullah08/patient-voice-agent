const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../patients.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB Error] Failed to connect to SQLite:', err.message);
  } else {
    console.log('[DB] Connected to persistent SQLite database at:', dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      patient_id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      sex TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      email TEXT,
      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      insurance_provider TEXT,
      insurance_member_id TEXT,
      preferred_language TEXT DEFAULT 'English',
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_phone ON patients(phone_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_lastname ON patients(last_name)`);
});

module.exports = db;