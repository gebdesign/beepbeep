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

function isGoodMatch(myProfile, theirProfile) {
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

  const myHobbies = myProfile.hobbies || []
  const theirHobbies = theirProfile.hobbies || []
  const commonHobbies = myHobbies.filter(h => theirHobbies.includes(h))
  if (myHobbies.length > 0 && theirHobbies.length > 0 && commonHobbies.length === 0) return false

  return true
}

export function useMatching({ onMatch, isActive, currentMode }) {
  const { user, profile } = useAuth()
  const watchIdRef = useRef(null)
  const myLocationRef = useRef(null)
  const notifiedUsersRef = useRef(new Set())

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

          // 매칭 DB에 저장하고 matchId 받아오기
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

    // 10초마다 주기적으로 매칭 탐색 (GPS 느린 경우 대비)
    const intervalId = setInterval(() => {
      if (myLocationRef.current) {
        checkNearbyUsers(myLocationRef.current.lat, myLocationRef.current.lon)
      }
    }, 10000)

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      clearInterval(intervalId)
    }

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [isActive, user, updateMyLocation, checkNearbyUsers])

  return { notifiedCount: notifiedUsersRef.current.size }
}
