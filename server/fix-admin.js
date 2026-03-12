/**
 * يضبط حسابات الأدمن: دور أدمن + كلمة مرور Admin123!
 * Run: npm run fix-admin
 */
import bcrypt from 'bcryptjs';
import { initDb, db } from './db.js';

await initDb();

const ADMIN_PASSWORD = 'Admin123!';
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const adminEmails = ['admin@unipilot.local', 'adm@unipilot.local'];

for (const email of adminEmails) {
  const row = await db.prepare('SELECT id, role FROM users WHERE email = ?').get(email);
  const name = email === 'adm@unipilot.local' ? 'Admin 2' : 'Admin';
  if (row) {
    await db.prepare('UPDATE users SET role = ?, password_hash = ?, full_name = ? WHERE email = ?').run('admin', adminHash, name, email);
    console.log('Updated:', email, '-> role: admin, password: Admin123!');
  } else {
    await db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)').run(email, adminHash, name, 'admin');
    console.log('Created:', email, '/ Admin123!');
  }
}

console.log('\nLog in with either:');
console.log('  admin@unipilot.local / Admin123!');
console.log('  adm@unipilot.local   / Admin123!');
process.exit(0);
