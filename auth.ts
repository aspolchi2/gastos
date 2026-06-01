import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/app/utils/mongodb";

const ALLOWED_EMAILS = ["aspolchi@gmail.com", "rogarciahughes@gmail.com"];

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: "gastos" }),
  providers: [Google],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ user }) {
      return !!user.email && ALLOWED_EMAILS.includes(user.email);
    },
  },
});
