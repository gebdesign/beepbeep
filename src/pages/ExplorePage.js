import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ExplorePage() {
  const { user, profile } = useAuth()
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanned, setScanned] = useState(false)

  const isPremium = profile?.plan === 'premium' || profile?.plan === 'premium_plus'
  const isPremiumPlus = profile?.plan === 'premium_plus'

  async function scanNearby() {
    if (!isPremium) return
    setLoading(true)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('locations')
        .select('*, profiles(*)')
        .eq('is_mode_active', true)
        .neq('user_id', user.id)
        .gte('updated_at', fiveMinutesAgo)

      // 반경 500m 안으로 필터
      const nearby = (data || []).filter(loc => {
        const R = 6371000
        const dLat = (loc.latitude - latitude) * Math.PI / 180
        const dLon = (loc.longitude - longitude) * Math.PI / 180
        const a = Math.sin(dLat/2)**2 + Math.cos(latitude * Math.PI/180) * Math.cos(loc.latitude * Math.PI/180) * Math.sin(dLon/2)**2
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return dist <= 500
      })

      setNearbyUsers(nearby)
      setScanned(true)
      setLoading(false)
    }, () => {
      setLoading(false)
      setScanned(true)
    })
  }

  // 비프리미엄 유저 화면
  if (!isPremium) {
    return (
      <div style={{ paddingBottom: 80, background: '#FFF5FA', minHeight: '100vh' }}>
        <div style={{ padding: '56px 24px 20px', background: 'white' }}>
          <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, color: '#3D1A2E' }}>주변 탐색 🔍</h1>
        </div>
        <div style={{ padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
          <h3 style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#3D1A2E' }}>
            프리미엄 기능이에요
          </h3>
          <p style={{ color: '#9C6B84', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            매칭이 안 된 상태에서도 주변 앱 사용자의 취미와 관심사를 미리 볼 수 있어요. 대화의 물꼬를 자연스럽게 트세요.
          </p>

          <div style={{ background: '#FFF5FA', borderRadius: 16, padding: 20, marginBottom: 12, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#D4609A' }}>🌟 프리미엄 $19.99/월</div>
            {['취미 / 관심사', '나이 힌트', '직업군 힌트'].map(item => (
              <div key={item} style={{ fontSize: 14, color: '#9C6B84', padding: '4px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: '#F472B6' }}>✓</span> {item}
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: 12 }}>프리미엄 시작하기</button>
          </div>

          <div style={{ background: '#EFF6FF', borderRadius: 16, padding: 20, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#1D4ED8' }}>💎 프리미엄+ $39.99/월</div>
            {['프리미엄 전부', '나이/직업 정확히', '채팅 무제한'].map(item => (
              <div key={item} style={{ fontSize: 14, color: '#9C6B84', padding: '4px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: '#3B82F6' }}>✓</span> {item}
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: 12, background: '#3B82F6' }}>프리미엄+ 시작하기</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80, background: '#FFF5FA', minHeight: '100vh' }}>
      <div style={{ padding: '56px 24px 16px', background: 'white' }}>
        <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, color: '#3D1A2E' }}>주변 탐색 🔍</h1>
        <p style={{ color: '#9C6B84', fontSize: 14, marginTop: 4 }}>
          반경 500m 안에 있는 앱 사용자의 관심사를 볼 수 있어요
        </p>
      </div>

      <div style={{ padding: '12px 16px 16px' }}>
        <button className="btn-primary" onClick={scanNearby} disabled={loading}>
          {loading ? '스캔 중...' : '🔍 지금 주변 스캔하기'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 16 }}>
          <div className="spinner" />
          <div style={{ color: '#9C6B84', fontSize: 14 }}>주변 유저를 탐색 중이에요...</div>
        </div>
      )}

      {scanned && !loading && nearbyUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#C4A0B5' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌸</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#3D1A2E' }}>주변에 활성 유저가 없어요</div>
          <div style={{ fontSize: 14 }}>조금 후에 다시 시도해봐요!</div>
        </div>
      )}

      {nearbyUsers.length > 0 && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nearbyUsers.map(loc => {
            const p = loc.profiles
            if (!p) return null
            return (
              <div key={loc.user_id} style={{ background: 'white', borderRadius: 16, border: '1px solid #FBF0F6', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div className="avatar" style={{ background: '#FDE8F2', color: '#D4609A' }}>
                    {isPremiumPlus ? (p.name?.[0] || '?') : '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isPremiumPlus ? '#3D1A2E' : '#C4A0B5' }}>
                      {isPremiumPlus ? p.name : '익명 사용자'}
                    </div>
                    <div style={{ fontSize: 13, color: '#9C6B84', marginTop: 2 }}>
                      {isPremiumPlus
                        ? `${p.age}세 · ${p.height}cm · ${p.occupation}`
                        : `${p.age ? Math.floor(p.age/10)*10 + '대' : ''} · ${p.occupation?.split(' ')[0] || ''}`
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#C4A0B5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>취미 / 관심사</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(p.hobbies || []).map(h => {
                      const isCommon = (profile?.hobbies || []).includes(h)
                      return (
                        <span key={h} className={`chip ${isCommon ? 'selected' : ''}`} style={{ fontSize: 12 }}>
                          {h} {isCommon ? '✓' : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {isPremiumPlus && p.ideal_marriage_intent && (
                  <div style={{ marginTop: 10, padding: '6px 12px', background: '#FFF5FA', borderRadius: 8, fontSize: 12, color: '#9C6B84' }}>
                    만남 목적: {p.ideal_marriage_intent}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
