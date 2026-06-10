import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/app/utils/mongodb";
import { INTEGRANTES } from "@/lib/integrantes";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: "gastos" }),
  providers: [Google],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ user }) {
      return !!user.email && (INTEGRANTES as readonly string[]).includes(user.email);
    },
  },
});
