import bcrypt from 'bcrypt';

export const hashPassword = async (password: string, saltRounds = 10): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
