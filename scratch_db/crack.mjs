import bcrypt from 'bcryptjs';

const hashToTest = '$2y$10$hgkiCi8RmOQLJQ4PLw1U0.0xDQF0AgHMoGHx9506sDa/FlZlCGg7G';

const commonPasswords = [
  'admin', '1234', '12345', '123456', 'password', 'villycar', 'villy', '123',
  'root', '12345678', '123456789', 'qwerty', 'admin123', 'admin1234',
  '1', '12', '1234567', 'test', 'demo', 'user', '1111', '0000', '12341234'
];

async function checkPasswords() {
  console.log('Testing passwords...');
  for (const pwd of commonPasswords) {
    const isMatch = await bcrypt.compare(pwd, hashToTest);
    if (isMatch) {
      console.log(`\nSUCCESS! The password is: ${pwd}\n`);
      return;
    }
  }
  console.log('Password not found in the common list.');
}

checkPasswords();
