const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => /^\d+_.*\.js$/.test(f))
    .sort();

  for (const file of files) {
    const migration = require(path.join(migrationsDir, file));
    if (typeof migration.up === 'function') {
      console.log(`Running migration: ${file}`);
      await migration.up();
    }
  }
  console.log('All migrations complete.');
}

runMigrations().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
}); 