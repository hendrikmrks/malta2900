import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Credentials-Provider unterstützt in NextAuth keine Datenbank-Sessions,
// daher ist JWT-Session hier die im NextAuth-Ökosystem übliche Standardvariante
// (kein DB-Adapter nötig, Session-Daten stecken signiert im Cookie).
export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        // E-Mail ist der unveraenderliche Login-Schluessel - der im Spiel
        // sichtbare Benutzername kann sich aendern, siehe /api/account/username.
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return { id: user.id, name: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      // Wird per `useSession().update()` clientseitig ausgeloest, direkt
      // nachdem der Benutzername geaendert wurde - so zeigt die Session sofort
      // den neuen Namen, ohne dass sich der Nutzer neu einloggen muss.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true },
        });
        if (fresh) {
          token.name = fresh.username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};
