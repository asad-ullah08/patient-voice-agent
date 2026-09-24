const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]);

function sendResponse(res, status, data = null, error = null) {
  return res.status(status).json({ data, error });
}

function validatePatient(body, isUpdate = false) {
  const errors = [];
  const required = ['first_name', 'last_name', 'date_of_birth', 'sex', 'phone_number', 'address_line_1', 'city', 'state', 'zip_code'];

  if (!isUpdate) {
    for (const f of required) {
      if (!body[f] || String(body[f]).trim() === '') {
        errors.push(`Missing required field: ${f}`);
      }
    }
  }

  if (body.state && !US_STATES.has(body.state.toUpperCase().trim())) {
    errors.push('State must be a valid 2-letter US abbreviation.');
  }

  if (body.sex && !['Male', 'Female', 'Other', 'Decline to Answer'].includes(body.sex)) {
    errors.push('Sex must be one of: Male, Female, Other, Decline to Answer.');
  }

  if (body.phone_number) {
    const clean = body.phone_number.replace(/\D/g, '');
    if (clean.length !== 10 && !(clean.length === 11 && clean.startsWith('1'))) {
      errors.push('phone_number must be a valid 10-digit US phone number.');
    }
  }

  if (body.date_of_birth) {
    const dob = new Date(body.date_of_birth);
    if (isNaN(dob.getTime()) || dob > new Date()) {
      errors.push('date_of_birth must be a valid date not in the future.');
    }
  }

  return errors;
}

function listPatients(req, res) {
  const { last_name, date_of_birth, phone_number } = req.query;
  let sql = 'SELECT * FROM patients WHERE deleted_at IS NULL';
  const params = [];

  if (last_name) {
    sql += ' AND LOWER(last_name) = LOWER(?)';
    params.push(last_name.trim());
  }
  if (date_of_birth) {
    sql += ' AND date_of_birth = ?';
    params.push(date_of_birth);
  }
  if (phone_number) {
    const clean = phone_number.replace(/\D/g, '').slice(-10);
    sql += ' AND phone_number LIKE ?';
    params.push(`%${clean}`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return sendResponse(res, 500, null, err.message);
    return sendResponse(res, 200, rows);
  });
}

function getPatientById(req, res) {
  const sql = 'SELECT * FROM patients WHERE patient_id = ? AND deleted_at IS NULL';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return sendResponse(res, 500, null, err.message);
    if (!row) return sendResponse(res, 404, null, 'Patient not found');
    return sendResponse(res, 200, row);
  });
}

function createPatient(req, res) {
  const errors = validatePatient(req.body);
  if (errors.length > 0) return sendResponse(res, 422, null, errors.join(', '));

  const patientId = uuidv4();
  const now = new Date().toISOString();
  const cleanPhone = req.body.phone_number.replace(/\D/g, '').slice(-10);

  const record = {
    patient_id: patientId,
    first_name: req.body.first_name.trim(),
    last_name: req.body.last_name.trim(),
    date_of_birth: req.body.date_of_birth,
    sex: req.body.sex,
    phone_number: cleanPhone,
    email: req.body.email || null,
    address_line_1: req.body.address_line_1.trim(),
    address_line_2: req.body.address_line_2 || null,
    city: req.body.city.trim(),
    state: req.body.state.toUpperCase().trim(),
    zip_code: req.body.zip_code.trim(),
    insurance_provider: req.body.insurance_provider || null,
    insurance_member_id: req.body.insurance_member_id || null,
    preferred_language: req.body.preferred_language || 'English',
    emergency_contact_name: req.body.emergency_contact_name || null,
    emergency_contact_phone: req.body.emergency_contact_phone || null,
    created_at: now,
    updated_at: now
  };

  const sql = `
    INSERT INTO patients (
      patient_id, first_name, last_name, date_of_birth, sex, phone_number,
      email, address_line_1, address_line_2, city, state, zip_code,
      insurance_provider, insurance_member_id, preferred_language,
      emergency_contact_name, emergency_contact_phone, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  db.run(sql, Object.values(record), function(err) {
    if (err) return sendResponse(res, 500, null, err.message);
    return sendResponse(res, 201, record);
  });
}

function updatePatient(req, res) {
  const errors = validatePatient(req.body, true);
  if (errors.length > 0) return sendResponse(res, 422, null, errors.join(', '));

  const fields = [];
  const params = [];
  const allowed = [
    'first_name', 'last_name', 'date_of_birth', 'sex', 'phone_number',
    'email', 'address_line_1', 'address_line_2', 'city', 'state', 'zip_code',
    'insurance_provider', 'insurance_member_id', 'preferred_language',
    'emergency_contact_name', 'emergency_contact_phone'
  ];

  allowed.forEach((col) => {
    if (req.body[col] !== undefined) {
      fields.push(`${col} = ?`);
      let val = req.body[col];
      if (col === 'state' && val) val = val.toUpperCase().trim();
      if (col === 'phone_number' && val) val = val.replace(/\D/g, '').slice(-10);
      params.push(val);
    }
  });

  if (fields.length === 0) return sendResponse(res, 400, null, 'No valid fields provided for update');

  fields.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);

  const sql = `UPDATE patients SET ${fields.join(', ')} WHERE patient_id = ? AND deleted_at IS NULL`;

  db.run(sql, params, function(err) {
    if (err) return sendResponse(res, 500, null, err.message);
    if (this.changes === 0) return sendResponse(res, 404, null, 'Patient not found');

    db.get('SELECT * FROM patients WHERE patient_id = ?', [req.params.id], (err2, row) => {
      if (err2) return sendResponse(res, 500, null, err2.message);
      return sendResponse(res, 200, row);
    });
  });
}

function deletePatient(req, res) {
  const sql = `UPDATE patients SET deleted_at = ? WHERE patient_id = ? AND deleted_at IS NULL`;
  db.run(sql, [new Date().toISOString(), req.params.id], function(err) {
    if (err) return sendResponse(res, 500, null, err.message);
    if (this.changes === 0) return sendResponse(res, 404, null, 'Patient not found');
    return sendResponse(res, 200, { message: 'Patient soft-deleted successfully' });
  });
}

module.exports = {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};