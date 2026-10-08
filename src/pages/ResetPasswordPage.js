import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const EXEMPT_EMAILS = ['gebdesign@gmail.com']

function validatePassword(password, email) {
  if (EXEMPT_EMAILS.includes(email?.toLowerCase())) return null
  if (password.length < 8) return '비밀번호는 8자리 이상이어야 해요'
  if (!/[A-Z]/.test(password)) return '대문자를 최소 1개 포함해주세요'
  if (!/[0-9]/.test(password)) return '숫자를 최소 1개 포함해주세요'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return '특수문자를 최소 1개 포함해주세요 (!@#$% 등)'
  return null
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const { setIsPasswordRecovery, user } = useAuth()

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirm) { setError('비밀번호가 일치하지 않아요'); return }
    const validationError = validatePassword(password, user?.email)
    if (validationError) { setError(validationError); return }
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
      <p style={{ color: '#9C6B84', lineHeight: 1.6, marginBottom: 32 }}>새 비밀번호로 로그인해주세요.</p>
      <button
        className="btn-primary"
        onClick={() => {
          setIsPasswordRecovery(false)
          supabase.auth.signOut()
        }}
      >
        로그인 하러 가기
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFF5FA' }}>
      <div style={{ padding: '60px 24px 32px', background: 'white' }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 32, fontWeight: 800, color: '#D4609A' }}>beepbeep</div>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 24, fontWeight: 800, marginTop: 16, color: '#3D1A2E' }}>새 비밀번호 설정 🔐</h2>
        <p style={{ color: '#9C6B84', marginTop: 6 }}>새로운 비밀번호를 입력해주세요</p>
      </div>

      <div style={{ flex: 1, padding: '24px 24px 32px', background: 'white' }}>
        <div style={{ background: '#FFF5FA', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#9C6B84', lineHeight: 1.7 }}>
          비밀번호 조건:<br />
          ✓ 8자리 이상<br />
          ✓ 대문자 1개 이상<br />
          ✓ 숫자 1개 이상<br />
          ✓ 특수문자 1개 이상 (!@#$% 등)
        </div>
        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>새 비밀번호</label>
            <input
              className="input-field"
              type="password"
              placeholder="새 비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>비밀번호 확인</label>
            <input
              className="input-field"
              type="password"
              placeholder="비밀번호 재입력"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && (
            <div style={{ background: '#FFF0F7', border: '1px solid #F9A8C9', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#D4609A' }}>
              {error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
