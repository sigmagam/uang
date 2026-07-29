// Usage: npm run hash-password -- "yourPasswordHere"
// Copy the printed hash into ADMIN_PASSWORD_HASH in your .env / Vercel env vars.
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error('Please provide a password, e.g: npm run hash-password -- "myPassword123"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nADMIN_PASSWORD_HASH=" + hash + "\n");
