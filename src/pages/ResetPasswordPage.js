import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const { setIsPasswordRecovery } = useAuth()

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않아요')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상이어야 해요')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#FFF5FA' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
      <h2 style={{ fontFamily: 'Nunito', fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#3D1A2E' }}>비밀번호가 변경됐어요!</h2>
      <p style={{ color: '#9C6B84', marginBottom: 32 }}>새 비밀번호로 로그인해주세요.</p>
      <button className="btn-primary" onClick={() => { setIsPasswordRecovery(false) }}>
        로그인하러 가기
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFF5FA' }}>
      <div style={{ padding: '60px 24px 32px', background: 'white' }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 32, fontWeight: 800, color: '#D4609A' }}>beepbeep</div>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 24, fontWeight: 800, marginTop: 16, color: '#3D1A2E' }}>
          새 비밀번호 설정 🔐
        </h2>
        <p style={{ color: '#9C6B84', marginTop: 6 }}>새로운 비밀번호를 입력해주세요</p>
      </div>

      <div style={{ flex: 1, padding: '24px 24px 32px', background: 'white' }}>
        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>새 비밀번호</label>
            <input
              className="input-field"
              type="password"
              placeholder="6자리 이상"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>비밀번호 확인</label>
            <input
              className="input-field"
              type="password"
              placeholder="한번 더 입력해주세요"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && (
            <div style={{ background: '#FFF0F7', border: '1px solid #F9A8C9', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#D4609A' }}>
              {error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
