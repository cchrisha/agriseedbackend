import jwt from "jsonwebtoken";

export function auth(req) {
  const header = req.headers.authorization;
  if (!header) throw new Error("No token");

  const token = header.split(" ")[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}
