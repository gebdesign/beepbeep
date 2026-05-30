import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ExplorePage() {
  const { user, profile } = useAuth()
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)

  const isPremium = profile?.plan === 'premium' || profile?.plan === 'premium_plus'
  const isPremiumPlus = profile?.plan === 'premium_plus'

  async function scanNearby() {
    if (!isPremium) return
    setScanning(true)
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

      setNearbyUsers(data || [])
      setLoading(false)
      setScanning(false)
    }, () => {
      setLoading(false)
      setScanning(false)
    })
  }

  function getVisibleInfo(theirProfile) {
    const info = { hobbies: theirProfile.hobbies }
    if (isPremium) {
      // 나이 힌트 (범위만)
      const age = theirProfile.age
      if (age) {
        const decade = Math.floor(age / 10) * 10
        info.age_hint = `${decade}대 ${age % 10 >= 5 ? '후반' : '초중반'}`
      }
      // 직업군 힌트 (업종만)
      info.occupation_hint = theirProfile.occupation?.split(' ')[0]
    }
    if (isPremiumPlus) {
      info.age = theirProfile.age
      info.occupation = theirProfile.occupation
      info.avatar_url = theirProfile.avatar_url
      info.name = theirProfile.name
    }
    return info
  }

  if (!isPremium) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '56px 24px 20px' }}>
          <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800 }}>주변 탐색 🔍</h1>
        </div>
        <div style={{ padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
          <h3 style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            프리미엄 기능이에요
          </h3>
          <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            매칭이 안 된 상태에서도 주변 앱 사용자의 취미와 관심사를 미리 볼 수 있어요. 대화의 물꼬를 자연스럽게 트세요.
          </p>
          <div style={{ background: '#FFF7ED', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>프리미엄에서 볼 수 있어요</div>
            {['취미 / 관심사 (전체)', '나이 힌트 (예: 20대 후반)', '직업군 힌트 (예: IT업종)'].map(item => (
              <div key={item} style={{ fontSize: 14, color: '#6B7280', padding: '6px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: '#FF6B6B' }}>✓</span> {item}
              </div>
            ))}
          </div>
          <div style={{ background: '#F0F9FF', borderRadius: 16, padding: 20, marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>프리미엄+에서 추가로</div>
            {['실제 나이', '직업 (정확히)', '프로필 사진'].map(item => (
              <div key={item} style={{ fontSize: 14, color: '#6B7280', padding: '6px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: '#3B82F6' }}>✓</span> {item}
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ marginBottom: 12 }}>
            프리미엄 시작하기 ($19.99/월)
          </button>
          <button className="btn-secondary">
            프리미엄+ 시작하기 ($39.99/월)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '56px 24px 20px' }}>
        <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800 }}>주변 탐색 🔍</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
          {isPremiumPlus ? '주변 유저의 상세 정보를 볼 수 있어요' : '주변 유저의 취미와 힌트를 볼 수 있어요'}
        </p>
      </div>

      <div style={{ padding: '0 16px 20px' }}>
        <button className="btn-primary" onClick={scanNearby} disabled={scanning}>
          {scanning ? '스캔 중...' : '🔍 지금 주변 스캔하기'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 16 }}>
          <div className="spinner" />
          <div style={{ color: '#6B7280', fontSize: 14 }}>주변 유저를 탐색 중이에요...</div>
        </div>
      ) : nearbyUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#9CA3AF' }}>
          주변에 활성 유저가 없어요.<br/>나중에 다시 시도해보세요.
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nearbyUsers.map(loc => {
            const info = getVisibleInfo(loc.profiles)
            return (
              <div key={loc.user_id} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div className="avatar">
                    {info.avatar_url ? <img src={info.avatar_url} alt="" /> : (info.name?.[0] || '?')}
                  </div>
                  <div>
                    {isPremiumPlus ? (
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{info.name}</div>
                    ) : (
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#9CA3AF' }}>익명 사용자</div>
                    )}
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      {info.age ? `${info.age}세` : info.age_hint} · {info.occupation || info.occupation_hint}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 8 }}>취미 / 관심사</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(info.hobbies || []).map(h => (
                      <span key={h} className="chip">{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
