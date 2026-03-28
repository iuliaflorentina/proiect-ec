import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function saveUserToDb(user) {
  try {
    const token = await user.getIdToken()
    await fetch(`${API}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: user.displayName || '',
        email: user.email,
      }),
    })
  } catch (e) {
    console.error('Could not save user to DB:', e)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const idTokenResult = await u.getIdTokenResult()
          const adminCheck = !!idTokenResult.claims.admin
          u.isAdmin = adminCheck
          setIsAdmin(adminCheck)
        } catch (e) {
          console.error("Error fetching token claims:", e)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signup = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    // Reload so displayName is visible immediately
    await cred.user.reload()
    await saveUserToDb({ ...cred.user, displayName })
    setUser(auth.currentUser)
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  /** Get a fresh ID token to send to the backend */
  const getToken = () => user?.getIdToken()

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signup, login, logout, getToken }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

