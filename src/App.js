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
  const { user, profile, loading, emailNotConfirmed } = useAuth()
  const [page, setPage] = useState('home')
  const [activeChatMatchId, setActiveChatMatchId] = useState(null)

  function goToChat(matchId) {
    setActiveChatMatchId(matchId || null)
    setPage('chat')
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#FFF5FA' }}>
      <div style={{ fontFamily: 'Nunito', fontSize: 32, fontWeight: 800, color: '#D4609A' }}>beepbeep</div>
      <div className="spinner" />
    </div>
  )

  if (!user) return <AuthPage />

  if (emailNotConfirmed) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#FFF5FA' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📧</div>
      <h2 style={{ fontFamily: 'Nunito', fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#3D1A2E' }}>이메일 인증이 필요해요</h2>
      <p style={{ color: '#9C6B84', lineHeight: 1.6, marginBottom: 32 }}>
        가입하신 이메일로 인증 링크를 보냈어요.<br/>링크를 클릭하면 로그인이 완료돼요.
      </p>
      <p style={{ color: '#C4A0B5', fontSize: 13 }}>이메일이 안 왔으면 스팸 폴더를 확인해봐요</p>
    </div>
  )

  if (!profile?.name) return <ProfileSetup onComplete={() => {}} />

  return (
    <div className="app-container">
      {page === 'home' && <HomePage onGoToChat={(matchId) => goToChat(matchId)} />}
      {page === 'explore' && <ExplorePage />}
      {page === 'chat' && <ChatPage initialMatchId={activeChatMatchId} />}
      {page === 'mypage' && <MyPage />}
      <BottomNav current={page} onChange={(p) => { setPage(p); if (p !== 'chat') setActiveChatMatchId(null) }} />
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
