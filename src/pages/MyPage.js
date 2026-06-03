import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const PLAN_LABELS = { free: '무료', premium: '프리미엄', premium_plus: '프리미엄+' }
const PLAN_COLORS = {
  free: { bg: '#FFF5FA', color: '#9C6B84', border: '#F5D0E8' },
  premium: { bg: '#FDE8F2', color: '#D4609A', border: '#F9A8C9' },
  premium_plus: { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' }
}

const HOBBIES = [
  '독서', '영화', '음악', '요리', '여행', '운동', '하이킹',
  '사진', '그림', '게임', '반려동물', '카페', '와인', '등산',
  '수움', '자전거', '요가', '명상', '쇼핑', '맛집탐방',
  '공연관람', '전시회', '드라이브', '캠핑', '골프', '테니스'
]

const AGE_RANGES = ['18-22세', '23-26세', '27-30세', '31-35세', '36-40세', '41세 이상', '상관없음']
const HEIGHT_RANGES = ['155cm 이하', '155-160cm', '160-165cm', '165-170cm', '170-175cm', '175-180cm', '180-185cm', '185cm 이상', '상관없음']
const MARRIAGE_INTENT = ['진지한 연애', '결혼 전제', '가볍게', '상관없음']

export default function MyPage() {
  const { profile, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(null) // 'basic' | 'hobbies' | 'ideal'
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({})

  const plan = profile?.plan || 'free'
  const planStyle = PLAN_COLORS[plan]

  function startEdit(section) {
    if (section === 'basic') {
      setEditData({
        name: profile?.name || '',
        age: profile?.age || '',
        height: profile?.height || '',
        occupation: profile?.occupation || '',
        income_range: profile?.income_range || '',
        ideal_marriage_intent: profile?.ideal_marriage_intent || '',
      })
    } else if (section === 'hobbies') {
      setEditData({ hobbies: [...(profile?.hobbies || [])] })
    } else if (section === 'ideal') {
      setEditData({
        ideal_age_range: [...(profile?.ideal_age_range || [])],
        ideal_height_range: [...(profile?.ideal_height_range || [])],
      })
    }
    setEditing(section)
  }

  async function saveEdit() {
    setSaving(true)
    await updateProfile({ ...editData })
    setSaving(false)
    setEditing(null)
  }

  function toggleItem(key, value) {
    setEditData(prev => ({
      ...prev,
      [key]: prev[key]?.includes(value)
        ? prev[key].filter(v => v !== value)
        : [...(prev[key] || []), value]
    }))
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setSaving(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateProfile({ avatar_url: data.publicUrl })
    }
    setSaving(false)
  }

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
            <label style={{ cursor: 'pointer', display: 'inline-block' }}>
              <div className="avatar" style={{ width: 64, height: 64, fontSize: 26, border: '3px solid white', boxShadow: '0 4px 12px rgba(244,114,182,0.2)', position: 'relative' }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile?.name?.[0] || '?'}
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, background: '#F472B6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white' }}>📷</div>
              </div>
              <input type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
            </label>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 800, color: '#3D1A2E' }}>{profile?.name}</div>
              <div style={{ fontSize: 14, color: '#9C6B84', marginTop: 2 }}>
                {profile?.age}세 · {profile?.height && `${profile.height}cm ·`} {profile?.occupation}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.border}`, borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                  {PLAN_LABELS[plan]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 기본 정보 수정 */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #FBF0F6', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3D1A2E' }}>기본 정보</div>
            <button onClick={() => editing === 'basic' ? saveEdit() : startEdit('basic')}
              style={{ background: 'none', border: 'none', color: '#D4609A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {saving && editing === 'basic' ? '저장 중...' : editing === 'basic' ? '저장' : '수정'}
            </button>
          </div>
          {editing === 'basic' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'name', label: '이름', placeholder: '이름 또는 닉네임' },
                { key: 'age', label: '나이', placeholder: '만 나이', type: 'number' },
                { key: 'height', label: '키', placeholder: 'cm', type: 'number' },
                { key: 'occupation', label: '직업', placeholder: '직업' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#9C6B84', display: 'block', marginBottom: 4 }}>{field.label}</label>
                  <input className="input-field" type={field.type || 'text'} placeholder={field.placeholder}
                    value={editData[field.key] || ''}
                    onChange={e => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{ padding: '10px 14px' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#9C6B84', display: 'block', marginBottom: 4 }}>연봉</label>
                <select className="input-field" value={editData.income_range || ''}
                  onChange={e => setEditData(prev => ({ ...prev, income_range: e.target.value }))}
                  style={{ padding: '10px 14px' }}>
                  <option value="">선택 안함</option>
                  {['$30k 미만', '$30k - $60k', '$60k - $100k', '$100k - $200k', '$200k 이상'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#9C6B84', display: 'block', marginBottom: 4 }}>만남 목적</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {MARRIAGE_INTENT.map(v => (
                    <button key={v} onClick={() => setEditData(prev => ({ ...prev, ideal_marriage_intent: v }))}
                      className={`select-btn ${editData.ideal_marriage_intent === v ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>
              <button className="btn-secondary" onClick={() => setEditing(null)} style={{ marginTop: 4 }}>취소</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '나이', value: profile?.age ? `${profile.age}세` : '-' },
                { label: '키', value: profile?.height ? `${profile.height}cm` : '-' },
                { label: '직업', value: profile?.occupation || '-' },
                { label: '연봉', value: profile?.income_range || '-' },
                { label: '만남 목적', value: profile?.ideal_marriage_intent || '-' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #FBF0F6' }}>
                  <span style={{ fontSize: 13, color: '#9C6B84' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3D1A2E' }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 취미 수정 */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #FBF0F6', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3D1A2E' }}>취미 / 관심사</div>
            <button onClick={() => editing === 'hobbies' ? saveEdit() : startEdit('hobbies')}
              style={{ background: 'none', border: 'none', color: '#D4609A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {saving && editing === 'hobbies' ? '저장 중...' : editing === 'hobbies' ? '저장' : '수정'}
            </button>
          </div>
          {editing === 'hobbies' ? (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {HOBBIES.map(h => (
                  <button key={h} onClick={() => toggleItem('hobbies', h)}
                    className={`chip ${editData.hobbies?.includes(h) ? 'selected' : ''}`}>{h}</button>
                ))}
              </div>
              <button className="btn-secondary" onClick={() => setEditing(null)}>취소</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(profile?.hobbies || []).map(h => (
                <span key={h} className="chip selected" style={{ fontSize: 12 }}>{h}</span>
              ))}
              {(!profile?.hobbies || profile.hobbies.length === 0) && (
                <span style={{ fontSize: 13, color: '#C4A0B5' }}>취미를 추가해보세요</span>
              )}
            </div>
          )}
        </div>

        {/* 이상형 수정 */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #FBF0F6', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3D1A2E' }}>이상형 조건</div>
            <button onClick={() => editing === 'ideal' ? saveEdit() : startEdit('ideal')}
              style={{ background: 'none', border: 'none', color: '#D4609A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {saving && editing === 'ideal' ? '저장 중...' : editing === 'ideal' ? '저장' : '수정'}
            </button>
          </div>
          {editing === 'ideal' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>나이대</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AGE_RANGES.map(v => (
                    <button key={v} onClick={() => toggleItem('ideal_age_range', v)}
                      className={`select-btn ${editData.ideal_age_range?.includes(v) ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>키 범위</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {HEIGHT_RANGES.map(v => (
                    <button key={v} onClick={() => toggleItem('ideal_height_range', v)}
                      className={`select-btn ${editData.ideal_height_range?.includes(v) ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>
              <button className="btn-secondary" onClick={() => setEditing(null)}>취소</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: '#9C6B84' }}>
                나이: {profile?.ideal_age_range?.join(', ') || '상관없음'}
              </div>
              <div style={{ fontSize: 13, color: '#9C6B84' }}>
                키: {profile?.ideal_height_range?.join(', ') || '상관없음'}
              </div>
            </div>
          )}
        </div>

        {/* 요금제 업그레이드 */}
        {plan === 'free' && (
          <div style={{ background: 'linear-gradient(135deg, #FDE8F2, #FCF0F8)', borderRadius: 18, padding: '20px 18px', border: '1px solid #F9A8C9' }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 18, fontWeight: 800, marginBottom: 6, color: '#D4609A' }}>
              프리미엄으로 업그레이드 🌟
            </div>
            <div style={{ fontSize: 13, color: '#9C6B84', lineHeight: 1.6, marginBottom: 16 }}>
              더 많은 매칭, 나이/직업 힌트, 주변 탐색 기능을 사용해보세요
            </div>
            <button className="btn-primary" style={{ marginBottom: 8 }}>프리미엄 $19.99/월</button>
            <button style={{ width: '100%', padding: '12px', background: 'white', border: '1.5px solid #F9A8C9', borderRadius: 14, color: '#D4609A', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito' }}>
              프리미엄+ $39.99/월
            </button>
          </div>
        )}

        {/* 로그아웃 */}
        <button onClick={signOut} style={{ width: '100%', padding: '14px', background: 'white', border: '1.5px solid #F9A8C9', borderRadius: 14, color: '#D4609A', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito' }}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
