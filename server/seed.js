import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

await initDb();

const adminPassword = 'Admin123!';
const studentPassword = 'Student123!';
const adminHash = bcrypt.hashSync(adminPassword, 10);
const studentHash = bcrypt.hashSync(studentPassword, 10);

async function seed() {
  const users = [
    ['admin@unipilot.local', adminHash, 'Admin', 'admin'],
    ['student@unipilot.local', studentHash, 'Student', 'student'],
  ];
  for (const [email, hash, name, role] of users) {
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!existing) {
      await db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)').run(email, hash, name, role);
    }
  }
}

await seed();
console.log('Seeded users:');
console.log('  Admin:  admin@unipilot.local / Admin123!');
console.log('  Student: student@unipilot.local / Student123!');
process.exit(0);
