<template>
  <view class="page">
    <view class="card">
      <view class="title">欢迎回来</view>
      <view class="subtitle">登录后使用 SOS 与社区互助功能</view>

      <input
        class="input"
        v-model.trim="username"
        placeholder="请输入手机号"
      />
      <input
        class="input"
        v-model="password"
        password
        placeholder="请输入密码"
      />

      <button class="btn primary" :loading="loading" @click="handleLogin">登录</button>
      <button class="btn plain" @click="goRegister">没有账号，去注册</button>
    </view>
  </view>
</template>

<script>
import { login } from '@/api/user.js'

export default {
  data() {
    return {
      loading: false,
      username: '',
      password: ''
    }
  },
  onLoad() {
    const token = uni.getStorageSync('token')
    if (token) {
      uni.switchTab({ url: '/pages/index/index' })
    }
  },
  methods: {
    async handleLogin() {
      if (!this.username) {
        return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
      }
      if (!this.password) {
        return uni.showToast({ title: '请输入密码', icon: 'none' })
      }

      this.loading = true
      try {
        const res = await login({
          username: this.username,
          password: this.password
        })
        console.log('登录接口返回：', res)

        if (res.code === 200) {
          uni.setStorageSync('token', res.data.token)
          uni.setStorageSync('userInfo', res.data.user)
          uni.setStorageSync('openid', `user_${res.data.user.id}`)

          uni.showToast({ title: res.message || '登录成功', icon: 'success' })
          uni.switchTab({ url: '/pages/index/index' })
        } else {
          uni.showToast({ title: res.message || '登录失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    goRegister() {
      uni.navigateTo({ url: '/pages/register/register' })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff4f2 0%, #f7f3ef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

.card {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 52rpx 36rpx;
  box-shadow: 0 20rpx 60rpx rgba(232, 91, 91, 0.14);
  box-sizing: border-box;
}

.title {
  font-size: 46rpx;
  font-weight: 800;
  color: #b4232a;
}

.subtitle {
  margin-top: 12rpx;
  margin-bottom: 48rpx;
  font-size: 26rpx;
  color: #9a6f6f;
}

.input {
  height: 96rpx;
  background: #fff7f6;
  border-radius: 22rpx;
  padding: 0 30rpx;
  margin-bottom: 26rpx;
  font-size: 28rpx;
  border: 1rpx solid #f7dddd;
  box-sizing: border-box;
}

.btn {
  height: 94rpx;
  border-radius: 47rpx;
  font-size: 30rpx;
  margin-top: 22rpx;
}

.primary {
  background: linear-gradient(135deg, #e85b5b, #f08a6b);
  color: #ffffff;
}

.plain {
  background: #fff1ef;
  color: #c03a3a;
}
</style>
