import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import prisma from "./prisma";

export function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (!name) return cookies;
    cookies[name.trim()] = rest.join("=").trim();
    return cookies;
  }, {});
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { assignments: true },
  });
}

export async function verifyCredentials(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? user : null;
}

export async function createUser({ email, password }) {
  const existing = await getUserByEmail(email);
  if (existing) return null;
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      premium: false,
      uploads: 0,
    },
  });
}

export async function createSession(userId) {
  const token = randomUUID();
  return prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getSession(token) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  return session;
}

export async function logoutSession(token) {
  if (!token) return;
  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function authenticateRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies.sessionToken;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  return getUserById(session.userId);
}

export function buildUserPayload(user) {
  const uploads = user.uploads ?? 0;
  const uploadLimit = user.premium ? 9999 : 3;
  return {
    email: user.email,
    premium: user.premium ?? false,
    uploads,
    uploadLimit,
    uploadsRemaining: Math.max(uploadLimit - uploads, 0),
    savedAssignments: (user.assignments || []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      prompt: assignment.prompt,
      result: JSON.parse(assignment.result),
      savedAt: assignment.createdAt.toISOString(),
    })),
  };
}

export async function incrementUpload(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { uploads: { increment: 1 } },
  });
}

export async function addSavedAssignment(userId, assignment) {
  await prisma.assignment.create({
    data: {
      title: assignment.title,
      prompt: assignment.prompt,
      result: JSON.stringify(assignment.result),
      userId,
    },
  });
  return getUserById(userId);
}

export async function upgradeToPremium(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { premium: true },
  });
}
