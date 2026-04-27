import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId) as any; 
export const auth = getAuth(app) as any;

// Add isPlaceholder flag if needed for the app's logic
if (db) db.isPlaceholder = false;
if (auth) auth.isPlaceholder = false;

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile };

export const createUserProfile = async (user: any, profileData: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', user.uid);
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    fullName: profileData.fullName || '',
    congressionalDistrict: profileData.congressionalDistrict || '',
    district: profileData.district || '',
    school: profileData.school || '',
    role: 'user',
    createdAt: Date.now(),
    ...profileData
  };
  await setDoc(userRef, profile);
  return profile;
};

export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};
