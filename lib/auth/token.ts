import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  email: string;
}

export const generateToken = (user: UserPayload): string => {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
};
