require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { exec } = require('child_process');

const migrationName = process.argv[2] || 'migration';

const command = `npx prisma migrate dev --name ${migrationName}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});
