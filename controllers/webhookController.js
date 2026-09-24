const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function handleVoiceWebhook(req, res) {
  const message = req.body?.message;
  console.log(`[Voice Log] Incoming event: ${message?.type}`);

  if (message && message.type === 'tool-calls') {
    const results = [];

    for (const toolCall of message.toolCalls) {
      const name = toolCall.function?.name;
      const args = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : (toolCall.function.arguments || {});

      // Tool 1: Check existing patient (bonus)
      if (name === 'check_existing_patient') {
        const cleanPhone = (args.phone_number || '').replace(/\D/g, '').slice(-10);
        const row = await new Promise((resolve) => {
          db.get(
            'SELECT first_name, last_name, patient_id FROM patients WHERE phone_number = ? AND deleted_at IS NULL',
            [cleanPhone],
            (err, r) => resolve(r)
          );
        });

        if (row) {
          results.push({
            toolCallId: toolCall.id,
            result: `Existing record found for ${row.first_name} ${row.last_name}. Ask if they want to update their information.`
          });
        } else {
          results.push({
            toolCallId: toolCall.id,
            result: "No existing patient found with this phone number. Continue new registration."
          });
        }
      }

      // Tool 2: Save patient record
      if (name === 'save_patient') {
        const patientId = uuidv4();
        const now = new Date().toISOString();
        const cleanPhone = (args.phone_number || '').replace(/\D/g, '').slice(-10);

        const sql = `
          INSERT INTO patients (
            patient_id, first_name, last_name, date_of_birth, sex,
            phone_number, email, address_line_1, address_line_2, city, state, zip_code,
            insurance_provider, insurance_member_id, preferred_language,
            emergency_contact_name, emergency_contact_phone, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const saveSuccess = await new Promise((resolve) => {
          db.run(sql, [
            patientId,
            args.first_name,
            args.last_name,
            args.date_of_birth,
            args.sex,
            cleanPhone,
            args.email || null,
            args.address_line_1,
            args.address_line_2 || null,
            args.city,
            (args.state || '').toUpperCase(),
            args.zip_code,
            args.insurance_provider || null,
            args.insurance_member_id || null,
            args.preferred_language || 'English',
            args.emergency_contact_name || null,
            args.emergency_contact_phone || null,
            now,
            now
          ], (err) => {
            if (err) console.error('[Voice DB Write Error]', err);
            resolve(!err);
          });
        });

        if (saveSuccess) {
          console.log(`[Voice Log] Patient created: ${args.first_name} ${args.last_name} (${patientId})`);
          results.push({
            toolCallId: toolCall.id,
            result: `Patient ${args.first_name} ${args.last_name} registered successfully with ID ${patientId}.`
          });
        } else {
          console.error('[Voice Log] DB insertion failed');
          results.push({
            toolCallId: toolCall.id,
            result: "Error: Could not save patient due to a database error."
          });
        }
      }
    }

    return res.json({ results });
  }

  return res.json({ status: 'ignored' });
}

module.exports = {
  handleVoiceWebhook
};