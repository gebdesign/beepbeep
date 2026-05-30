import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('welcome')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(error.message)
      } else {
        const { error } = await signUp(email, password)
        if (error) setError(error.message)
        else setMode('verify')
      }
    } catch (err) {
      setError('문제가 생겼어요. 다시 시도해주세요.')
    }
    setLoading(false)
  }

  if (mode === 'welcome') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, #FDE8F2 0%, #FCF0F8 50%, #FFF5FA 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px 40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'rgba(249,168,201,0.2)', top: -100, right: -100 }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(244,114,182,0.1)', bottom: 20, left: -60 }} />
        <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'rgba(249,168,201,0.15)', top: 100, left: -40 }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 72, marginBottom: 12 }}>📍</div>
          <h1 style={{
            fontFamily: 'Nunito',
            fontSize: 52,
            fontWeight: 800,
            color: '#D4609A',
            letterSpacing: -1,
            lineHeight: 1,
            textShadow: '0 2px 12px rgba(212,96,154,0.2)'
          }}>beep<br/>beep</h1>
          <p style={{ color: '#9C6B84', fontSize: 16, marginTop: 14, fontWeight: 600 }}>
            지금 이 순간, 당신 근처의 인연
          </p>
        </div>

        <div style={{
          position: 'absolute', bottom: 30, right: 20,
          background: 'white', borderRadius: 20, padding: '14px 18px',
          boxShadow: '0 8px 32px rgba(244,114,182,0.2)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FDE8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👋</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E' }}>148m 거리에 매칭!</div>
            <div style={{ fontSize: 11, color: '#9C6B84' }}>공통 취미: 독서, 하이킹</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 24px 48px', background: 'white' }}>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#3D1A2E' }}>
          현실에서 만나는<br/>진짜 인연 💕
        </h2>
        <p style={{ color: '#9C6B84', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          지금 근처에 있는 이상형을 실시간으로 만나보세요.
        </p>
        <button className="btn-primary" onClick={() => setMode('signup')} style={{ marginBottom: 12 }}>
          시작하기
        </button>
        <button className="btn-secondary" onClick={() => setMode('login')}>
          이미 계정이 있어요
        </button>
      </div>
    </div>
  )

  if (mode === 'verify') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#FFF5FA' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📧</div>
      <h2 style={{ fontFamily: 'Nunito', fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#3D1A2E' }}>이메일을 확인해주세요</h2>
      <p style={{ color: '#9C6B84', lineHeight: 1.6, marginBottom: 32 }}>
        {email}로 인증 링크를 보냈어요.<br/>링크를 클릭하면 가입이 완료돼요.
      </p>
      <button className="btn-secondary" onClick={() => setMode('login')}>
        로그인으로 돌아가기
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFF5FA' }}>
      <div style={{ padding: '60px 24px 32px', background: 'white' }}>
        <button onClick={() => setMode('welcome')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, color: '#9C6B84', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          ← 뒤로
        </button>
        <div style={{ fontFamily: 'Nunito', fontSize: 32, fontWeight: 800, color: '#D4609A' }}>beepbeep</div>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 24, fontWeight: 800, marginTop: 16, color: '#3D1A2E' }}>
          {mode === 'login' ? '다시 만나요 👋' : '처음 오셨군요 🌸'}
        </h2>
        <p style={{ color: '#9C6B84', marginTop: 6 }}>
          {mode === 'login' ? '이메일과 비밀번호를 입력해주세요' : '이메일로 간단하게 시작해요'}
        </p>
      </div>

      <div style={{ flex: 1, padding: '0 24px 32px', background: 'white' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>이메일</label>
            <input className="input-field" type="email" placeholder="hello@beepbeep.app" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>비밀번호</label>
            <input className="input-field" type="password" placeholder="6자리 이상" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && (
            <div style={{ background: '#FFF0F7', border: '1px solid #F9A8C9', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#D4609A' }}>
              {error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '잠깐만요...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: '#9C6B84', fontSize: 14 }}>
            {mode === 'login' ? '아직 계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          </span>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#D4609A', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {mode === 'login' ? '가입하기' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}
