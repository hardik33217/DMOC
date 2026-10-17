import argon2 from "argon2";

const MEMORY_COST = parseInt(process.env.ARGON2_MEMORY_COST || "65536", 10);
const TIME_COST = parseInt(process.env.ARGON2_TIME_COST || "3", 10);
const PARALLELISM = parseInt(process.env.ARGON2_PARALLELISM || "4", 10);

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: MEMORY_COST,
    timeCost: TIME_COST,
    parallelism: PARALLELISM,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
}