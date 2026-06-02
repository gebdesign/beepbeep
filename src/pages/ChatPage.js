import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const COOKIE_PLANS = [
  { count: 100, price: '$1.99', perMsg: '$0.02' },
  { count: 300, price: '$4.99', perMsg: '$0.017' },
  { count: 500, price: '$7.99', perMsg: '$0.016' },
  { count: 1000, price: '$12.99', perMsg: '$0.013' },
]

const FREE_CHAT_LIMIT = 10

export default function ChatPage({ initialMatchId }) {
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState([])
  const [activeMatch, setActiveMatch] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCookieModal, setShowCookieModal] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatContainerRef = useRef(null)

  useEffect(() => { fetchMatches() }, [user])

  useEffect(() => {
    if (initialMatchId && matches.length > 0) {
      const match = matches.find(m => m.id === initialMatchId)
      if (match) setActiveMatch(match)
    }
  }, [initialMatchId, matches])

  useEffect(() => {
    if (!activeMatch) return
    fetchMessages(activeMatch.id)
    const sub = supabase.channel(`messages:${activeMatch.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${activeMatch.id}` },
        payload => {
          setMessages(prev => [...prev, payload.new])
        })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [activeMatch])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  async function fetchMatches() {
    if (!user) return
    const { data } = await supabase
      .from('matches')
      .select('*, user1:profiles!matches_user1_id_fkey(*), user2:profiles!matches_user2_id_fkey(*)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
    setMatches(data || [])
    setLoading(false)
  }

  async function fetchMessages(matchId) {
    const { data } = await supabase
      .from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeMatch) return
    const isPremiumPlus = profile?.plan === 'premium_plus'
    const cookieCount = profile?.cookie_count || 0
    const msgCount = messages.filter(m => m.sender_id === user.id).length
    if (!isPremiumPlus) {
      if (msgCount >= FREE_CHAT_LIMIT && cookieCount <= 0) {
        setShowCookieModal(true)
        return
      }
    }
    const content = newMsg.trim()
    setNewMsg('')
    await supabase.from('messages').insert({ match_id: activeMatch.id, sender_id: user.id, content })
    inputRef.current?.focus()
    scrollToBottom()
  }

  function getOtherUser(match) {
    return match.user1_id === user?.id ? match.user2 : match.user1
  }

  function getChatStatus() {
    const isPremiumPlus = profile?.plan === 'premium_plus'
    if (isPremiumPlus) return { canChat: true, label: '무제한', remaining: 999 }
    const cookieCount = profile?.cookie_count || 0
    const msgCount = messages.filter(m => m.sender_id === user.id).length
    if (msgCount < FREE_CHAT_LIMIT) return { canChat: true, label: `${FREE_CHAT_LIMIT - msgCount}회 남음`, remaining: FREE_CHAT_LIMIT - msgCount }
    if (cookieCount > 0) return { canChat: true, label: `🍪 ${cookieCount}개`, remaining: cookieCount }
    return { canChat: false, label: '채팅 소진', remaining: 0 }
  }

  if (activeMatch) {
    const otherUser = getOtherUser(activeMatch)
    const chatStatus = getChatStatus()

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'white',
        paddingBottom: '68px'
      }}>
        {/* 헤더 */}
        <div style={{ padding: '56px 16px 12px', borderBottom: '1px solid #FBF0F6', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, background: 'white' }}>
          <button onClick={() => setActiveMatch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9C6B84' }}>←</button>
          <div className="avatar">{otherUser?.name?.[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#3D1A2E' }}>{otherUser?.name}</div>
            <div style={{ fontSize: 12, color: '#9C6B84' }}>{otherUser?.age}세 · {otherUser?.height}cm</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: chatStatus.remaining <= 3 && chatStatus.remaining > 0 ? '#E84545' : '#D4609A', padding: '4px 10px', background: '#FDE8F2', borderRadius: 99 }}>
            {chatStatus.label}
          </div>
        </div>

        {/* 메시지 목록 */}
        <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FFF5FA' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💕</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#3D1A2E' }}>{otherUser?.name}님과 매칭됐어요!</div>
              <div style={{ fontSize: 14, color: '#9C6B84' }}>먼저 인사해봐요 👋</div>
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === user.id
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 16px',
                  background: isMine ? 'linear-gradient(135deg, #F9A8C9, #F472B6)' : 'white',
                  color: isMine ? 'white' : '#3D1A2E',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: 15, lineHeight: 1.4,
                  boxShadow: '0 2px 8px rgba(244,114,182,0.1)'
                }}>
                  {msg.content}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력란 */}
        {chatStatus.canChat ? (
          <div style={{ flexShrink: 0, padding: '10px 16px', borderTop: '1px solid #FBF0F6', display: 'flex', gap: 10, background: 'white', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
            <input
              ref={inputRef}
              className="input-field"
              placeholder="메세지를 입력하세요..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              onFocus={scrollToBottom}
              style={{ flex: 1 }}
            />
            <button onClick={sendMessage} disabled={!newMsg.trim()} style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #F9A8C9, #F472B6)',
              border: 'none', cursor: 'pointer', color: 'white', fontSize: 20,
              opacity: newMsg.trim() ? 1 : 0.5, flexShrink: 0
            }}>↑</button>
          </div>
        ) : (
          <div style={{ flexShrink: 0, padding: '12px 16px', background: 'white', borderTop: '1px solid #FBF0F6' }}>
            <div style={{ textAlign: 'center', fontSize: 14, color: '#9C6B84', marginBottom: 8 }}>채팅 횟수를 모두 사용했어요</div>
            <button className="btn-primary" onClick={() => setShowCookieModal(true)} style={{ marginBottom: 8 }}>쿠키 구매하기 🍪</button>
          </div>
        )}

        {/* 쿠키/업그레이드 모달 */}
        {showCookieModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(61,26,46,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%' }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 800, marginBottom: 4, color: '#3D1A2E' }}>채팅을 계속하려면 🍪</div>
              <div style={{ fontSize: 13, color: '#9C6B84', marginBottom: 20 }}>쿠키를 구매하거나 프리미엄+로 업그레이드하면 무제한으로 채팅할 수 있어요!</div>

              {/* 프리미엄+ 업그레이드 */}
              <div style={{ background: 'linear-gradient(135deg, #FDE8F2, #EFF6FF)', borderRadius: 16, padding: '16px', marginBottom: 16, border: '1.5px solid #F9A8C9' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#3D1A2E', marginBottom: 4 }}>💎 프리미엄+ $39.99/월</div>
                <div style={{ fontSize: 13, color: '#9C6B84', marginBottom: 12 }}>채팅 무제한 + 나이/직업/연봉 정보 + 사진 공개</div>
                <button className="btn-primary" style={{ padding: '12px' }}>프리미엄+로 업그레이드</button>
              </div>

              {/* 쿠키 구매 */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9C6B84', marginBottom: 10 }}>🍪 쿠키 구매 (1개 = 채팅 1회)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                {COOKIE_PLANS.map(plan => (
                  <button key={plan.count} style={{ padding: '12px', background: '#FFF5FA', borderRadius: 12, border: '1.5px solid #F5D0E8', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#3D1A2E' }}>🍪 {plan.count}개</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#D4609A' }}>{plan.price}</div>
                    <div style={{ fontSize: 11, color: '#C4A0B5' }}>개당 {plan.perMsg}</div>
                  </button>
                ))}
              </div>
              <button className="btn-secondary" onClick={() => setShowCookieModal(false)}>닫기</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 매칭 목록
  return (
    <div style={{ paddingBottom: 80, background: '#FFF5FA', minHeight: '100vh' }}>
      <div style={{ padding: '56px 24px 20px', background: 'white' }}>
        <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 800, color: '#3D1A2E' }}>채팅 💬</h1>
        <p style={{ color: '#9C6B84', fontSize: 14, marginTop: 4 }}>매칭된 분들과 대화해보세요</p>
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💤</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#3D1A2E' }}>아직 매칭이 없어요</div>
          <div style={{ color: '#9C6B84', fontSize: 14 }}>홈에서 모드를 켜고 나가보세요!</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {matches.map(match => {
            const other = getOtherUser(match)
            return (
              <button key={match.id} onClick={() => setActiveMatch(match)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', background: 'white', border: 'none', cursor: 'pointer', borderRadius: 16, textAlign: 'left', marginBottom: 4 }}>
                <div className="avatar" style={{ flexShrink: 0 }}>{other?.name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3D1A2E' }}>{other?.name}</div>
                  <div style={{ fontSize: 13, color: '#C4A0B5', marginTop: 2 }}>{other?.age}세 · {other?.height}cm · {other?.occupation}</div>
                </div>
                <div style={{ fontSize: 16, color: '#F5D0E8' }}>›</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
