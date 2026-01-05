import bcrypt from "bcryptjs";

export async function hashPasscode(passcode: string) {
  const salt = process.env.PASSCODE_SALT;
  if (!salt) {
    throw new Error("PASSCODE_SALT is not set");
  }

  return bcrypt.hash(passcode + salt, 10);
}

export async function verifyPasscode(passcode: string, hash: string) {
  const salt = process.env.PASSCODE_SALT;
  if (!salt) {
    throw new Error("PASSCODE_SALT is not set");
  }

  return bcrypt.compare(passcode + salt, hash);
}
