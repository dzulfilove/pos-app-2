import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export function useUserData() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const querySnapshot = await getDocs(collection(db, "users", uid));
        setUserData(querySnapshot.docs.map((doc) => doc.data()));
      } else {
        setUserData(null);
      }
    });
  }, []);

  return userData;
}
