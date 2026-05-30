import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

const PLAN_LABELS = { free: '무료', premium: '프리미엄', premium_plus: '프리미엄+' }
const PLAN_COLORS = {
  free: { bg: '#FFF5FA', color: '#9C6B84', border: '#F5D0E8' },
  premium: { bg: '#FDE8F2', color: '#D4609A', border: '#F9A8C9' },
  premium_plus: { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' }
}

export default function MyPage() {
  const { profile, signOut, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const plan = profile?.plan || 'free'
  const planStyle = PLAN_COLORS[plan]

  return (
    <div style={{ paddingBottom: 80, background: '#FFF5FA', minHeight: '100vh' }}>
      <div style={{ padding: '56px 24px 20px', background: 'white' }}>
        <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, color: '#3D1A2E' }}>마이페이지</h1>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 프로필 카드 */}
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #FBF0F6' }}>
          <div style={{ height: 80, background: 'linear-gradient(135deg, #FDE8F2, #FCF0F8)' }} />
          <div style={{ padding: '0 20px 20px', marginTop: -30 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 26, border: '3px solid white', boxShadow: '0 4px 12px rgba(244,114,182,0.2)' }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile?.name?.[0] || '?'}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 800, color: '#3D1A2E' }}>{profile?.name}</div>
              <div style={{ fontSize: 14, color: '#9C6B84', marginTop: 2 }}>
                {profile?.age}세 · {profile?.height && `${profile.height}cm ·`} {profile?.occupation}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.border}`, borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                  {PLAN_LABELS[plan]}
                </span>
                {(profile?.cookie_count > 0) && (
                  <span style={{ display: 'inline-block', padding: '4px 12px', background: '#FFF7ED', color: '#D97706', border: '1px solid #FED7AA', borderRadius: 99, fontSize: 12, fontWeight: 700, marginLeft: 6 }}>
                    🍪 {profile.cookie_count}개
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 취미 */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #FBF0F6', padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', marginBottom: 12 }}>취미 / 관심사</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(profile?.hobbies || []).map(h => (
              <span key={h} className="chip selected" style={{ fontSize: 12 }}>{h}</span>
            ))}
            {(!profile?.hobbies || profile.hobbies.length === 0) && (
              <span style={{ fontSize: 13, color: '#C4A0B5' }}>취미를 추가해보세요</span>
            )}
          </div>
        </div>

        {/* 이상형 요약 */}
        {(profile?.ideal_age_range?.length > 0 || profile?.ideal_height_range?.length > 0) && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #FBF0F6', padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', marginBottom: 12 }}>이상형 조건</div>
            {profile?.ideal_age_range?.length > 0 && (
              <div style={{ fontSize: 13, color: '#9C6B84', marginBottom: 6 }}>
                나이: {profile.ideal_age_range.join(', ')}
              </div>
            )}
            {profile?.ideal_height_range?.length > 0 && (
              <div style={{ fontSize: 13, color: '#9C6B84', marginBottom: 6 }}>
                키: {profile.ideal_height_range.join(', ')}
              </div>
            )}
            {profile?.ideal_marriage_intent && (
              <div style={{ fontSize: 13, color: '#9C6B84' }}>
                목적: {profile.ideal_marriage_intent}
              </div>
            )}
          </div>
        )}

        {/* 요금제 업그레이드 */}
        {plan === 'free' && (
          <div style={{ background: 'linear-gradient(135deg, #FDE8F2, #FCF0F8)', borderRadius: 18, padding: '20px 18px', border: '1px solid #F9A8C9' }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 18, fontWeight: 800, marginBottom: 6, color: '#D4609A' }}>
              프리미엄으로 업그레이드 🌟
            </div>
            <div style={{ fontSize: 13, color: '#9C6B84', lineHeight: 1.6, marginBottom: 16 }}>
              더 많은 매칭, 나이/직업 힌트, 주변 탐색 기능을 사용해보세요
            </div>
            <button className="btn-primary" style={{ marginBottom: 8 }}>
              프리미엄 $19.99/월
            </button>
            <button style={{
              width: '100%', padding: '12px', background: 'white',
              border: '1.5px solid #F9A8C9', borderRadius: 14, color: '#D4609A',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito'
            }}>
              프리미엄+ $39.99/월
            </button>
          </div>
        )}

        {/* 쿠키 구매 */}
        {plan !== 'premium_plus' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #FBF0F6', padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', marginBottom: 4 }}>🍪 채팅 쿠키</div>
            <div style={{ fontSize: 13, color: '#9C6B84', marginBottom: 12 }}>쿠키로 채팅 횟수를 추가해요</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[['100개', '$1.99'], ['300개', '$4.99'], ['500개', '$7.99'], ['1000개', '$12.99']].map(([count, price]) => (
                <button key={count} style={{
                  padding: '10px 12px', background: '#FFF5FA', borderRadius: 12,
                  border: '1.5px solid #F5D0E8', cursor: 'pointer', textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#3D1A2E' }}>🍪 {count}</div>
                  <div style={{ fontSize: 12, color: '#D4609A', fontWeight: 700 }}>{price}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 로그아웃 */}
        <button onClick={signOut} style={{
          width: '100%', padding: '14px', background: 'white',
          border: '1.5px solid #F9A8C9', borderRadius: 14, color: '#D4609A',
          fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito'
        }}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
