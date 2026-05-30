import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import ProfileSetup from './pages/ProfileSetup'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import ChatPage from './pages/ChatPage'
import MyPage from './pages/MyPage'
import BottomNav from './components/BottomNav'
import './styles.css'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const [page, setPage] = useState('home')

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'Nunito', fontSize: 32, fontWeight: 800, color: '#FF6B6B' }}>beepbeep</div>
      <div className="spinner" />
    </div>
  )

  if (!user) return <AuthPage />
  if (!profile?.name) return <ProfileSetup onComplete={() => {}} />

  return (
    <div className="app-container">
      {page === 'home' && <HomePage />}
      {page === 'explore' && <ExplorePage />}
      {page === 'chat' && <ChatPage />}
      {page === 'mypage' && <MyPage />}
      <BottomNav current={page} onChange={setPage} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
