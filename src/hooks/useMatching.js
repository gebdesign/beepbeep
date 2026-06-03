import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const MATCH_RADIUS_METERS = 150

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// 키 범위 문자열 파싱 (예: "175-180cm" → {min: 175, max: 180})
function parseHeightRange(rangeStr) {
  if (!rangeStr || rangeStr === '상관없음') return null
  if (rangeStr.includes('이하')) return { min: 0, max: parseInt(rangeStr) }
  if (rangeStr.includes('이상')) return { min: parseInt(rangeStr), max: 999 }
  const match = rangeStr.match(/(\d+)-(\d+)/)
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) }
  return null
}

// 나이대 문자열 파싱 (예: "27-30세" → {min: 27, max: 30})
function parseAgeRange(rangeStr) {
  if (!rangeStr || rangeStr === '상관없음') return null
  if (rangeStr.includes('이상')) return { min: parseInt(rangeStr), max: 999 }
  const match = rangeStr.match(/(\d+)-(\d+)/)
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) }
  // "18-22세" 같은 형식
  const match2 = rangeStr.match(/(\d+)/)
  if (match2) return { min: parseInt(match2[1]), max: parseInt(match2[1]) + 4 }
  return null
}

function isHeightMatch(idealRanges, actualHeight) {
  if (!idealRanges || idealRanges.length === 0) return true
  if (!actualHeight) return true
  const hasAnyMatch = idealRanges.some(rangeStr => {
    if (rangeStr === '상관없음') return true
    const range = parseHeightRange(rangeStr)
    if (!range) return true
    return actualHeight >= range.min && actualHeight <= range.max
  })
  return hasAnyMatch
}

function isAgeMatch(idealRanges, actualAge) {
  if (!idealRanges || idealRanges.length === 0) return true
  if (!actualAge) return true
  const hasAnyMatch = idealRanges.some(rangeStr => {
    if (rangeStr === '상관없음') return true
    const range = parseAgeRange(rangeStr)
    if (!range) return true
    return actualAge >= range.min && actualAge <= range.max
  })
  return hasAnyMatch
}

function isGoodMatch(myProfile, theirProfile) {
  // 성별 매칭
  if (myProfile.match_preference === 'opposite') {
    if (myProfile.gender === 'male' && theirProfile.gender !== 'female') return false
    if (myProfile.gender === 'female' && theirProfile.gender !== 'male') return false
  } else if (myProfile.match_preference === 'same') {
    if (myProfile.gender !== theirProfile.gender) return false
  }

  if (theirProfile.match_preference === 'opposite') {
    if (theirProfile.gender === 'male' && myProfile.gender !== 'female') return false
    if (theirProfile.gender === 'female' && myProfile.gender !== 'male') return false
  } else if (theirProfile.match_preference === 'same') {
    if (theirProfile.gender !== myProfile.gender) return false
  }

  // 내 이상형 키 조건 → 상대방 키 체크
  if (myProfile.ideal_height_range?.length > 0) {
    if (!isHeightMatch(myProfile.ideal_height_range, theirProfile.height)) return false
  }

  // 상대방 이상형 키 조건 → 내 키 체크
  if (theirProfile.ideal_height_range?.length > 0) {
    if (!isHeightMatch(theirProfile.ideal_height_range, myProfile.height)) return false
  }

  // 내 이상형 나이 조건 → 상대방 나이 체크
  if (myProfile.ideal_age_range?.length > 0) {
    if (!isAgeMatch(myProfile.ideal_age_range, theirProfile.age)) return false
  }

  // 상대방 이상형 나이 조건 → 내 나이 체크
  if (theirProfile.ideal_age_range?.length > 0) {
    if (!isAgeMatch(theirProfile.ideal_age_range, myProfile.age)) return false
  }

  // 공통 취미 (1개 이상)
  const myHobbies = myProfile.hobbies || []
  const theirHobbies = theirProfile.hobbies || []
  if (myHobbies.length > 0 && theirHobbies.length > 0) {
    const commonHobbies = myHobbies.filter(h => theirHobbies.includes(h))
    if (commonHobbies.length === 0) return false
  }

  return true
}

export function useMatching({ onMatch, isActive, currentMode }) {
  const { user, profile } = useAuth()
  const watchIdRef = useRef(null)
  const myLocationRef = useRef(null)
  const notifiedUsersRef = useRef(new Set())
  const intervalRef = useRef(null)

  const updateMyLocation = useCallback(async (lat, lon) => {
    if (!user) return
    await supabase.from('locations').upsert({
      user_id: user.id,
      latitude: lat,
      longitude: lon,
      mode: currentMode,
      is_mode_active: isActive,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  }, [user, currentMode, isActive])

  const checkNearbyUsers = useCallback(async (myLat, myLon) => {
    if (!profile || !isActive) return

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: nearbyLocations } = await supabase
      .from('locations')
      .select('*, profiles(*)')
      .eq('is_mode_active', true)
      .neq('user_id', user.id)
      .gte('updated_at', fiveMinutesAgo)

    if (!nearbyLocations) return

    for (const loc of nearbyLocations) {
      if (notifiedUsersRef.current.has(loc.user_id)) continue

      const distance = getDistanceMeters(myLat, myLon, loc.latitude, loc.longitude)
      if (distance <= MATCH_RADIUS_METERS && loc.profiles) {
        if (isGoodMatch(profile, loc.profiles)) {
          notifiedUsersRef.current.add(loc.user_id)

          const { data: matchData } = await supabase.from('matches').insert({
            user1_id: user.id,
            user2_id: loc.user_id,
            status: 'pending'
          }).select().single()

          onMatch && onMatch({
            profile: loc.profiles,
            distance: Math.round(distance),
            matchId: matchData?.id
          })
        }
      }
    }
  }, [profile, user, isActive, onMatch])

  useEffect(() => {
    if (!isActive || !user) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (user) updateMyLocation(0, 0)
      return
    }

    if (!navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        myLocationRef.current = { lat: latitude, lon: longitude }
        updateMyLocation(latitude, longitude)
        checkNearbyUsers(latitude, longitude)
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    // 10초마다 주기적으로 탐색
    intervalRef.current = setInterval(() => {
      if (myLocationRef.current) {
        checkNearbyUsers(myLocationRef.current.lat, myLocationRef.current.lon)
      }
    }, 10000)

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, user, updateMyLocation, checkNearbyUsers])

  return { notifiedCount: notifiedUsersRef.current.size }
}
