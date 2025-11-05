// src/lib/ensureUserProfile.ts
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export async function ensureUserProfile(defaultRole: 'student'|'psych'|'admin' = 'student') {
  const u = auth.currentUser;
  if (!u) return;
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: u.email ?? '',
      name: u.displayName ?? '',
      role: defaultRole,   // normalmente 'student'
      orgId: null,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
}
