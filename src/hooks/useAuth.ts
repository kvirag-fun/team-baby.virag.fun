import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth, SHARED_EMAIL } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoading(false);
  }), []);

  async function login(password: string) {
    await signInWithEmailAndPassword(auth, SHARED_EMAIL, password);
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, loading, login, logout };
}
