import jwt from "jsonwebtoken";

export function auth(req) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return null;
    }

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    const token = parts[1];

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null; 
  }
}
