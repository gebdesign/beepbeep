import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useMatching } from '../hooks/useMatching'
import { supabase } from '../lib/supabase'
import { registerPushNotification, sendLocalNotification } from '../lib/pushNotification'

const MODES = [
  { id: 'daily', label: '데일리', emoji: '☀️', desc: '일상, 카페, 출퇴근' },
  { id: 'leisure', label: '여가', emoji: '🌿', desc: '공원, 산책' },
  { id: 'leisure_sport', label: '레저', emoji: '⚽', desc: '헬스장, 스포츠' },
  { id: 'shopping', label: '쇼핑', emoji: '🛍️', desc: '쇼핑몰, 마켓' },
  { id: 'friday', label: '금요일', emoji: '🎉', desc: '퇴근 후 금요일' },
  { id: 'weekend', label: '주말', emoji: '🌅', desc: '토/일 낮' },
  { id: 'bar', label: '술집', emoji: '🍺', desc: '바, 펍' },
  { id: 'club', label: '클럽', emoji: '🎵', desc: '나이트, 클럽' },
  { id: 'dining', label: '다이닝', emoji: '🍽️', desc: '레스토랑, 브런치' },
  { id: 'travel', label: '여행', emoji: '✈️', desc: '공항, 여행지' },
  { id: 'culture', label: '문화', emoji: '🎨', desc: '전시, 공연' },
  { id: 'pet', label: '반려동물', emoji: '🐾', desc: '펫카페' },
]

function playHeartbeat() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    function beat(time) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 80
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.8, time + 0.02)
      gain.gain.linearRampToValueAtTime(0, time + 0.12)
      osc.start(time)
      osc.stop(time + 0.12)
    }
    for (let i = 0; i < 3; i++) {
      beat(ctx.currentTime + i * 0.6)
      beat(ctx.currentTime + i * 0.6 + 0.18)
    }
  } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 400, 100, 50, 100, 400, 100, 50, 100])
}

function MatchInfo({ matchProfile, myProfile, currentMode }) {
  const commonHobbies = (matchProfile.hobbies || []).filter(h => (myProfile?.hobbies || []).includes(h))

  const modeLabels = {
    daily: '데일리 ☀️', leisure: '여가 🌿', leisure_sport: '레저 ⚽',
    shopping: '쇼핑 🛍️', friday: '금요일 🎉', weekend: '주말 🌅',
    bar: '술집 🍺', club: '클럽 🎵', dining: '다이닝 🍽️',
    travel: '여행 ✈️', culture: '문화 🎨', pet: '반려동물 🐾'
  }

  const matchedConditions = []
  if (myProfile?.ideal_age_range?.length > 0 && !myProfile.ideal_age_range.includes('상관없음')) matchedConditions.push({ label: '나이', matched: true })
  if (myProfile?.ideal_height_range?.length > 0 && !myProfile.ideal_height_range.includes('상관없음')) matchedConditions.push({ label: '키', matched: true })
  if (matchProfile.ideal_marriage_intent && myProfile?.ideal_marriage_intent && matchProfile.ideal_marriage_intent === myProfile.ideal_marriage_intent) matchedConditions.push({ label: `만남 목적 (${matchProfile.ideal_marriage_intent})`, matched: true })

  return (
    <div style={{ background: '#FFF5FA', borderRadius: 14, padding: '14px 16px', marginBottom: 14, textAlign: 'left', width: '100%' }}>
      {/* 매칭된 조건 */}
      {matchedConditions.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: '#C4A0B5', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>매칭 조건</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {matchedConditions.map((c, i) => (
              <span key={i} style={{ background: '#FDE8F2', color: '#D4609A', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>
                ✓ {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 공통 취미 */}
      {commonHobbies.length > 0 && (
        <div style={{ marginBottom: currentMode ? 10 : 0 }}>
          <div style={{ fontSize: 12, color: '#C4A0B5', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>공통 취미</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {commonHobbies.map(h => (
              <span key={h} className="chip selected" style={{ fontSize: 12 }}>{h}</span>
            ))}
          </div>
        </div>
      )}

      {/* 현재 모드 */}
      {currentMode && (
        <div style={{ marginTop: commonHobbies.length > 0 || matchedConditions.length > 0 ? 10 : 0 }}>
          <div style={{ fontSize: 12, color: '#C4A0B5', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>현재 모드</div>
          <span style={{ background: 'linear-gradient(135deg, #F9A8C9, #F472B6)', color: 'white', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>
            {modeLabels[currentMode] || currentMode}
          </span>
        </div>
      )}
    </div>
  )
}

export default function HomePage({ onGoToChat }) {
  const { profile, user } = useAuth()
  const [activeMode, setActiveMode] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const [matchNotifs, setMatchNotifs] = useState([])
  const [showMatch, setShowMatch] = useState(null)
  const [chatRequest, setChatRequest] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)
  const audioUnlocked = useRef(false)

  // 푸시 알림 등록
  useEffect(() => {
    registerPushNotification()
  }, [])

  useEffect(() => {
    function unlock() {
      if (!audioUnlocked.current) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          ctx.resume()
          audioUnlocked.current = true
        } catch(e) {}
      }
    }
    document.addEventListener('touchstart', unlock, { once: true })
    document.addEventListener('click', unlock, { once: true })
    return () => {
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('click', unlock)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const channelName = `match-updates-${user.id}`
    const sub = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches',
      }, async (payload) => {
        const match = payload.new
        const isInvolved = match.user1_id === user.id || match.user2_id === user.id
        if (!isInvolved) return

        if (match.user2_id === user.id && match.status === 'chat_requested') {
          const { data: senderProfile } = await supabase
            .from('profiles').select('*').eq('id', match.user1_id).single()
          if (senderProfile) {
            playHeartbeat()
            setChatRequest({ matchId: match.id, profile: senderProfile })
            sendLocalNotification(
              'beepbeep 💬',
              `${senderProfile.name}님이 채팅을 요청했어요!`
            )
          }
        }

        if (match.status === 'accepted') {
          clearInterval(countdownRef.current)
          setCountdown(null)
          setShowMatch(null)
          setChatRequest(null)
          onGoToChat && onGoToChat(match.id)
        }
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [user, onGoToChat])

  function handleMatch(matchData) {
    setShowMatch(matchData)
    setMatchNotifs(prev => [matchData, ...prev])
    playHeartbeat()
    // 백그라운드 알림
    sendLocalNotification(
      'beepbeep 💕',
      `${matchData.profile.name}님이 ${matchData.distance}m 근처에 있어요!`
    )
  }

  useMatching({ onMatch: handleMatch, isActive: isActive && !!activeMode, currentMode: activeMode })

  function toggleMode(modeId) {
    if (activeMode === modeId && isActive) { setIsActive(false); setActiveMode(null) }
    else { setActiveMode(modeId); setIsActive(true) }
  }

  async function handleChatRequest() {
    if (!showMatch?.matchId) return
    await supabase.from('matches').update({ status: 'chat_requested' }).eq('id', showMatch.matchId)
    setCountdown(10)
    let count = 10
    countdownRef.current = setInterval(async () => {
      count--
      setCountdown(count)
      if (count <= 0) {
        clearInterval(countdownRef.current)
        setCountdown(null)
        await supabase.from('matches').update({ status: 'rejected' }).eq('id', showMatch.matchId)
        setShowMatch(null)
        alert('상대방이 다음에 만나요 😊')
      }
    }, 1000)
  }

  async function acceptChat() {
    if (!chatRequest?.matchId) return
    await supabase.from('matches').update({ status: 'accepted' }).eq('id', chatRequest.matchId)
    const mid = chatRequest.matchId
    setChatRequest(null)
    onGoToChat && onGoToChat(mid)
  }

  async function rejectChat() {
    if (!chatRequest?.matchId) return
    await supabase.from('matches').update({ status: 'rejected' }).eq('id', chatRequest.matchId)
    setChatRequest(null)
  }

  const selectedMode = MODES.find(m => m.id === activeMode)

  return (
    <div style={{ paddingBottom: 80, background: '#FFF5FA', minHeight: '100vh' }}>
      <div style={{ padding: '56px 24px 20px', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 14, color: '#9C6B84', fontWeight: 500 }}>안녕하세요 🌸</p>
            <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, marginTop: 2, color: '#3D1A2E' }}>
              {profile?.name || '새로운 인연'}님
            </h1>
          </div>
          <div style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 800, color: '#D4609A' }}>beep</div>
        </div>
      </div>

      {isActive && selectedMode ? (
        <div style={{ margin: '12px 16px', padding: '16px 20px', background: 'linear-gradient(135deg, #F9A8C9, #F472B6)', borderRadius: 18, color: 'white', boxShadow: '0 4px 20px rgba(244,114,182,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>현재 모드</div>
              <div style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 800 }}>{selectedMode.emoji} {selectedMode.label} 모드 ON</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>반경 150m 내 매칭 탐색 중...</div>
            </div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 4px rgba(255,255,255,0.3)', animation: 'pulse 2s infinite' }} />
          </div>
        </div>
      ) : (
        <div style={{ margin: '12px 16px', padding: '16px 20px', background: 'white', borderRadius: 18, border: '1.5px dashed #F5D0E8' }}>
          <div style={{ fontSize: 14, color: '#C4A0B5', textAlign: 'center' }}>아래에서 모드를 선택하면 매칭이 시작돼요 👇</div>
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#C4A0B5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>지금 어디 계세요?</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {MODES.map(mode => {
            const isSelected = activeMode === mode.id && isActive
            return (
              <button key={mode.id} onClick={() => toggleMode(mode.id)} style={{
                padding: '14px 8px', borderRadius: 16,
                border: `2px solid ${isSelected ? '#F472B6' : '#FBF0F6'}`,
                background: isSelected ? '#FDE8F2' : 'white',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isSelected ? '0 4px 16px rgba(244,114,182,0.2)' : 'none'
              }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{mode.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#D4609A' : '#3D1A2E', fontFamily: 'Nunito' }}>{mode.label}</div>
                <div style={{ fontSize: 10, color: '#C4A0B5', marginTop: 2, lineHeight: 1.3 }}>{mode.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {matchNotifs.length > 0 && (
        <div style={{ padding: '24px 16px 0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#C4A0B5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            오늘의 매칭 ({matchNotifs.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matchNotifs.map((notif, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'white', borderRadius: 16, border: '1px solid #FBF0F6' }}>
                <div className="avatar">{notif.profile.name?.[0] || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3D1A2E' }}>{notif.profile.name}</div>
                  <div style={{ fontSize: 13, color: '#9C6B84', marginTop: 2 }}>
                    {notif.distance}m · {notif.profile.age}세 · {notif.profile.height}cm · {notif.profile.occupation}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#F472B6', fontWeight: 700 }}>NEW</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 채팅 요청 팝업 */}
      {chatRequest && (
        <div className="match-popup">
          <div className="match-popup-card">
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <h3 style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#3D1A2E' }}>
              채팅 요청이 왔어요!
            </h3>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, margin: '0 auto 12px' }}>
              {chatRequest.profile.name?.[0]}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#3D1A2E' }}>{chatRequest.profile.name}</div>
            <MatchInfo matchProfile={chatRequest.profile} myProfile={profile} currentMode={activeMode} />
            <button className="btn-primary" onClick={acceptChat} style={{ marginBottom: 10 }}>수락 ✓</button>
            <button className="btn-secondary" onClick={rejectChat}>나중에</button>
          </div>
        </div>
      )}

      {/* 매칭 팝업 */}
      {showMatch && !chatRequest && (
        <div className="match-popup">
          <div className="match-popup-card" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💕</div>
            <h3 style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 800, marginBottom: 6, color: '#3D1A2E' }}>
              근처에 있어요!
            </h3>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, margin: '0 auto 12px' }}>
              {showMatch.profile.name?.[0] || '?'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2, color: '#3D1A2E' }}>{showMatch.profile.name}</div>
            <div style={{ color: '#9C6B84', fontSize: 13, marginBottom: 12 }}>{showMatch.distance}m 거리에 있어요</div>
            <MatchInfo matchProfile={showMatch.profile} myProfile={profile} currentMode={activeMode} />
            {countdown !== null ? (
              <div style={{ padding: '14px', background: '#FDE8F2', borderRadius: 14, marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#D4609A', fontFamily: 'Nunito' }}>{countdown}</div>
                <div style={{ fontSize: 13, color: '#9C6B84' }}>상대방 응답 기다리는 중...</div>
              </div>
            ) : (
              <button className="btn-primary" onClick={handleChatRequest} style={{ marginBottom: 10 }}>
                채팅하기 💬
              </button>
            )}
            {countdown === null && (
              <button className="btn-secondary" onClick={() => setShowMatch(null)}>나중에</button>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
