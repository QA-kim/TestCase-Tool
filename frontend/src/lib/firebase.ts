import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCXVfvWqvPZqTXBwf_wYTKtW-h8Ym03Ej4",
  authDomain: "testcase-e27a4.firebaseapp.com",
  projectId: "testcase-e27a4",
  storageBucket: "testcase-e27a4.firebasestorage.app",
  messagingSenderId: "885766969293",
  appId: "1:885766969293:web:3e8e4f3f4a3e4f3f3e4f3f"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Storage
export const storage = getStorage(app)
