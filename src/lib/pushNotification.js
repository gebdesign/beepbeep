// 푸시 알림 설정 및 전송

export async function registerPushNotification() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported')
    return null
  }

  try {
    // 서비스 워커 등록
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('SW registered')

    // 알림 권한 요청
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Permission denied')
      return null
    }

    return registration
  } catch (err) {
    console.error('Push registration failed:', err)
    return null
  }
}

// 로컬 알림 (앱이 백그라운드일 때)
export async function sendLocalNotification(title, body) {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100, 300, 100, 50, 100],
    })
  } catch (err) {
    // 앱이 포그라운드면 그냥 무시
    console.log('Notification skipped:', err)
  }
}
