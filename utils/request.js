const BASE_URL = 'http://192.168.43.66:5000'

function normalizeOptions(options, method = 'GET', data = {}, header = {}) {
  if (typeof options === 'string') {
    return {
      url: options,
      method,
      data,
      header: typeof header === 'boolean' ? {} : header
    }
  }
  return options || {}
}

function handleUnauthorized(res, reject) {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('openid')
  uni.removeStorageSync('volunteerProfile')
  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/login/login' })
  }, 800)
  reject(res)
}

export const request = (options, method = 'GET', data = {}, header = {}) => {
  const config = normalizeOptions(options, method, data, header)
  const token = uni.getStorageSync('token')
  const url = config.url || ''
  const requestMethod = config.method || 'GET'
  const requestData = config.data || {}

  console.log('请求地址：', BASE_URL + url)
  console.log('请求方法：', requestMethod)
  console.log('请求数据：', requestData)

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method: requestMethod,
      data: requestData,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(config.header || {})
      },
      success: (res) => {
        console.log('响应状态码：', res.statusCode)
        console.log('响应数据：', res.data)

        if (res.statusCode === 401 || res.data?.code === 401) {
          handleUnauthorized(res, reject)
          return
        }
        resolve(res.data)
      },
      fail: (err) => {
        console.error('请求失败：', err)
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export default request
