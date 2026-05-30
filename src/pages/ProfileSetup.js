import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

const HOBBIES = [
  '독서', '영화', '음악', '요리', '여행', '운동', '하이킹',
  '사진', '그림', '게임', '반려동물', '카페', '와인', '등산',
  '수영', '자전거', '요가', '명상', '쇼핑', '맛집탐방',
  '공연관람', '전시회', '드라이브', '캠핑', '골프', '테니스'
]

const STEPS = ['기본정보', '취미/관심사', '이상형', '공개동의']

// 이상형 옵션들
const AGE_RANGES = ['18-22세', '23-26세', '27-30세', '31-35세', '36-40세', '41세 이상', '상관없음']
const HEIGHT_RANGES = ['155cm 이하', '155-160cm', '160-165cm', '165-170cm', '170-175cm', '175-180cm', '180-185cm', '185cm 이상', '상관없음']
const HOBBY_IMPORTANCE = ['필수 (꼭 맞아야 해요)', '있으면 좋아요', '상관없어요']
const MARRIAGE_INTENT = ['진지한 연애', '결혼 전제', '가볍게', '상관없음']
// 프리미엄 이상
const JOB_TYPES = ['IT/개발', '의료/바이오', '금융/경제', '교육', '예술/디자인', '법률', '서비스업', '자영업', '공무원', '기타']
const INCOME_PREF = ['$30k 미만', '$30k-60k', '$60k-100k', '$100k-200k', '$200k 이상', '상관없음']
// 프리미엄+
const ASSET_PREF = ['$100k 미만', '$100k-500k', '$500k-1M', '$1M 이상', '상관없음']
const CAR_PREF = ['있어야 해요', '있으면 좋아요', '상관없어요']
const EDU_PREF = ['고졸', '대졸', '대학원 이상', '상관없음']

export default function ProfileSetup({ onComplete }) {
  const { updateProfile, user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: '', age: '', gender: '', match_preference: 'opposite',
    height: '', occupation: '', income_range: '',
    hobbies: [], consent_public_hobbies: false,
    // 이상형
    ideal_age_range: [], ideal_height_range: [], ideal_hobby_importance: '',
    ideal_marriage_intent: '',
    // 프리미엄 이상형
    ideal_job_types: [], ideal_income: '', ideal_assets: '', ideal_car: '', ideal_education: ''
  })

  function update(key, value) { setData(prev => ({ ...prev, [key]: value })) }

  function toggleArray(key, value) {
    setData(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }))
  }

  function toggleHobby(hobby) { toggleArray('hobbies', hobby) }

  async function handleFinish() {
    setLoading(true)
    await updateProfile({ ...data, age: parseInt(data.age), id: user.id })
    setLoading(false)
    onComplete && onComplete()
  }

  const progress = ((step + 1) / STEPS.length) * 100

  const SelectBtn = ({ value, selected, onClick, children }) => (
    <button onClick={onClick} className={`select-btn ${selected ? 'selected' : ''}`}>
      {children || value}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* 진행바 */}
      <div style={{ padding: '56px 24px 0', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#9C6B84', fontWeight: 600 }}>{step + 1} / {STEPS.length}</span>
          <span style={{ fontSize: 13, color: '#D4609A', fontWeight: 700 }}>{STEPS[step]}</span>
        </div>
        <div style={{ height: 4, background: '#FDE8F2', borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #F9A8C9, #F472B6)', borderRadius: 99, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* 컨텐츠 */}
      <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>

        {/* 스텝 1: 기본정보 */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, color: '#3D1A2E' }}>안녕하세요! 🌸<br/>기본 정보를 알려주세요</h2>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>이름 (닉네임 가능)</label>
              <input className="input-field" placeholder="이름을 입력해주세요" value={data.name} onChange={e => update('name', e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>나이</label>
              <input className="input-field" type="number" placeholder="만 나이" min="18" max="99" value={data.age} onChange={e => update('age', e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>성별</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['male', '남성 👨'], ['female', '여성 👩'], ['other', '기타']].map(([val, label]) => (
                  <button key={val} onClick={() => update('gender', val)} style={{
                    flex: 1, padding: '12px 8px', borderRadius: 14,
                    border: `2px solid ${data.gender === val ? '#F472B6' : '#F5D0E8'}`,
                    background: data.gender === val ? '#FDE8F2' : 'white',
                    cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    color: data.gender === val ? '#D4609A' : '#9C6B84',
                    fontFamily: 'Nunito'
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>매칭 선호</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['opposite', '이성'], ['same', '동성'], ['all', '상관없음']].map(([val, label]) => (
                  <button key={val} onClick={() => update('match_preference', val)} style={{
                    flex: 1, padding: '12px 8px', borderRadius: 14,
                    border: `2px solid ${data.match_preference === val ? '#F472B6' : '#F5D0E8'}`,
                    background: data.match_preference === val ? '#FDE8F2' : 'white',
                    cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    color: data.match_preference === val ? '#D4609A' : '#9C6B84',
                    fontFamily: 'Nunito'
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>키</label>
              <input className="input-field" type="number" placeholder="cm" min="140" max="220" value={data.height} onChange={e => update('height', e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>직업</label>
              <input className="input-field" placeholder="예: 개발자, 디자이너, 의사..." value={data.occupation} onChange={e => update('occupation', e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 8 }}>연봉 범위 <span style={{ color: '#C4A0B5', fontWeight: 400 }}>(선택)</span></label>
              <select className="input-field" value={data.income_range} onChange={e => update('income_range', e.target.value)}>
                <option value="">선택 안함</option>
                <option>$30k 미만</option>
                <option>$30k - $60k</option>
                <option>$60k - $100k</option>
                <option>$100k - $200k</option>
                <option>$200k 이상</option>
              </select>
            </div>
          </div>
        )}

        {/* 스텝 2: 취미 */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#3D1A2E' }}>취미와 관심사 🎯</h2>
            <p style={{ color: '#9C6B84', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              공통 취미가 있는 분과 매칭 확률이 높아져요!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {HOBBIES.map(hobby => (
                <button key={hobby} onClick={() => toggleHobby(hobby)} className={`chip ${data.hobbies.includes(hobby) ? 'selected' : ''}`}>
                  {hobby}
                </button>
              ))}
            </div>
            {data.hobbies.length > 0 && (
              <div style={{ marginTop: 20, padding: '12px 16px', background: '#F0FDF4', borderRadius: 12, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                ✓ {data.hobbies.length}개 선택됨
              </div>
            )}
          </div>
        )}

        {/* 스텝 3: 이상형 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, color: '#3D1A2E' }}>이상형을 알려주세요 💝</h2>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>원하는 나이대 (복수선택)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AGE_RANGES.map(v => (
                  <button key={v} onClick={() => toggleArray('ideal_age_range', v)} className={`select-btn ${data.ideal_age_range.includes(v) ? 'selected' : ''}`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>원하는 키 범위 (복수선택)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HEIGHT_RANGES.map(v => (
                  <button key={v} onClick={() => toggleArray('ideal_height_range', v)} className={`select-btn ${data.ideal_height_range.includes(v) ? 'selected' : ''}`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>공통 취미 중요도</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {HOBBY_IMPORTANCE.map(v => (
                  <button key={v} onClick={() => update('ideal_hobby_importance', v)} className={`select-btn ${data.ideal_hobby_importance === v ? 'selected' : ''}`} style={{ textAlign: 'left', borderRadius: 12 }}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>만남의 목적</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MARRIAGE_INTENT.map(v => (
                  <button key={v} onClick={() => update('ideal_marriage_intent', v)} className={`select-btn ${data.ideal_marriage_intent === v ? 'selected' : ''}`}>{v}</button>
                ))}
              </div>
            </div>

            {/* 프리미엄 이상 */}
            <div style={{ padding: 16, background: '#FFF5FA', borderRadius: 16, border: '1px dashed #F9A8C9' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#D4609A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>🌟 프리미엄 이상형 조건</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>선호 직업군 (복수선택)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {JOB_TYPES.map(v => (
                    <button key={v} onClick={() => toggleArray('ideal_job_types', v)} className={`select-btn ${data.ideal_job_types.includes(v) ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>선호 연봉</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INCOME_PREF.map(v => (
                    <button key={v} onClick={() => update('ideal_income', v)} className={`select-btn ${data.ideal_income === v ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>학력</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EDU_PREF.map(v => (
                    <button key={v} onClick={() => update('ideal_education', v)} className={`select-btn ${data.ideal_education === v ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 프리미엄+ */}
            <div style={{ padding: 16, background: '#F0F9FF', borderRadius: 16, border: '1px dashed #93C5FD' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>💎 프리미엄+ 이상형 조건</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>선호 자산</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ASSET_PREF.map(v => (
                    <button key={v} onClick={() => update('ideal_assets', v)} className={`select-btn ${data.ideal_assets === v ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', display: 'block', marginBottom: 10 }}>차량</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CAR_PREF.map(v => (
                    <button key={v} onClick={() => update('ideal_car', v)} className={`select-btn ${data.ideal_car === v ? 'selected' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 스텝 4: 공개동의 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, color: '#3D1A2E' }}>마지막 단계! 🎉<br/>정보 공개 동의</h2>
            <p style={{ color: '#9C6B84', fontSize: 14, lineHeight: 1.6 }}>
              beepbeep은 진지한 만남을 위한 앱이에요. 아래 정보는 가입 시 동의하신 범위 내에서만 공개됩니다.
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, background: '#FFF5FA', borderRadius: 14, border: '1px solid #F5D0E8' }}>
              <label className="toggle" style={{ flexShrink: 0, marginTop: 2 }}>
                <input type="checkbox" checked={data.consent_public_hobbies} onChange={e => update('consent_public_hobbies', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#3D1A2E' }}>
                  취미 / 관심사 공개 <span style={{ fontSize: 11, color: '#F472B6' }}>필수</span>
                </div>
                <div style={{ fontSize: 13, color: '#9C6B84', lineHeight: 1.5 }}>앱 사용자 누구에게나 취미가 공개됩니다. 프리미엄 유저는 비매칭 상태에서도 볼 수 있어요.</div>
              </div>
            </div>

            {/* 요금제별 공개 정보 */}
            <div style={{ background: '#FFF5FA', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3D1A2E', marginBottom: 12 }}>요금제별 공개 정보</div>
              {[
                { plan: '무료', color: '#9C6B84', bg: '#FFF5FA', border: '#F5D0E8', items: ['취미/관심사', '채팅 10회 제공'] },
                { plan: '프리미엄 $19.99/월', color: '#D4609A', bg: '#FDE8F2', border: '#F9A8C9', items: ['취미/관심사', '나이 힌트', '직업군 힌트', '쿠키 추가 구매 가능'] },
                { plan: '프리미엄+ $39.99/월', color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD', items: ['취미/관심사', '나이/직업/연봉 정확히', '사진 공개', '채팅 무제한'] },
              ].map(item => (
                <div key={item.plan} style={{ padding: '10px 12px', background: item.bg, borderRadius: 10, border: `1px solid ${item.border}`, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.plan}</div>
                  {item.items.map(i => <div key={i} style={{ fontSize: 12, color: '#9C6B84' }}>• {i}</div>)}
                </div>
              ))}
            </div>

            <div style={{ padding: 14, background: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA' }}>
              <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                📌 연봉, 자산, 연락처 등 민감한 정보는 절대 공개되지 않으며, 매칭 후 본인이 직접 선택해서 공유할 수 있어요.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: '16px 24px 40px', background: 'white', borderTop: '1px solid #FBF0F6' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep(s => s - 1)} style={{ width: 'auto', padding: '16px 24px' }}>이전</button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && (!data.name || !data.age || !data.gender)}>
              다음
            </button>
          ) : (
            <button className="btn-primary" onClick={handleFinish}
              disabled={loading || !data.consent_public_hobbies}>
              {loading ? '저장 중...' : 'beepbeep 시작하기 🎉'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
