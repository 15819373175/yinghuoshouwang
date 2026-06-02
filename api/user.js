import { request } from '@/utils/request.js'

export function login(data) {
  return request({
    url: '/api/user/login',
    method: 'POST',
    data
  })
}

export function register(data) {
  return request({
    url: '/api/user/register',
    method: 'POST',
    data
  })
}

export function getUserProfile() {
  return request('/api/user/me', 'GET', {}, true).then((res) => {
    console.log('用户信息返回：', res)
    return res
  })
}

export function updateEmergencyContact(data) {
  return request({
    url: '/api/user/emergency-contact',
    method: 'PUT',
    data
  })
}

export function updateSecuritySettings(data) {
  return request({
    url: '/api/user/security-settings',
    method: 'PUT',
    data
  })
}
