<template>
  <view class="page">
    <view class="card">
      <view class="title">注册账号</view>
      <view class="subtitle">加入乡村互助安全守护网络</view>

      <input class="input" v-model.trim="form.username" placeholder="请输入姓名" />
      <input
        class="input"
        v-model.trim="form.phone"
        type="number"
        maxlength="11"
        placeholder="请输入手机号"
      />
      <input class="input" v-model="form.password" password placeholder="请输入密码" />
      <input class="input" v-model.trim="form.village" placeholder="请输入所在村组" />

      <button class="btn primary" :loading="loading" @click="handleRegister">注册</button>
      <button class="btn plain" @click="goLogin">已有账号，去登录</button>
    </view>
  </view>
</template>

<script>
import { register } from '@/api/user.js'

export default {
  data() {
    return {
      loading: false,
      form: {
        username: '',
        phone: '',
        password: '',
        village: ''
      }
    }
  },
  methods: {
    async handleRegister() {
      const form = {
        username: this.form.username,
        password: this.form.password,
        phone: this.form.phone,
        nickname: this.form.nickname || this.form.username,
        role: 'user'
      }

      console.log('准备注册')
      console.log('注册表单：', form)

      if (!form.username) {
        return uni.showToast({ title: '请输入姓名', icon: 'none' })
      }
      if (!/^1\d{10}$/.test(form.phone)) {
        return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
      }
      if (!form.password) {
        return uni.showToast({ title: '请输入密码', icon: 'none' })
      }
      this.loading = true
      try {
        const res = await register(form)
        console.log('注册接口返回：', res)

        if (res.code === 200) {
          uni.showToast({ title: '注册成功', icon: 'success' })
          uni.redirectTo({ url: '/pages/login/login' })
          return
        }

        uni.showToast({
          title: res.message || res.msg || '注册失败',
          icon: 'none'
        })
      } catch (err) {
        console.error('注册请求异常：', err)
        const message = err?.data?.message || err?.data?.msg || err?.message || '注册失败'
        uni.showToast({
          title: message,
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    goLogin() {
      uni.redirectTo({ url: '/pages/login/login' })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f3ef;
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
  padding: 48rpx 36rpx;
  box-shadow: 0 20rpx 60rpx rgba(232, 91, 91, 0.14);
  box-sizing: border-box;
}

.title {
  font-size: 44rpx;
  font-weight: 800;
  color: #b4232a;
}

.subtitle {
  margin-top: 12rpx;
  margin-bottom: 40rpx;
  font-size: 26rpx;
  color: #9a6f6f;
}

.input {
  height: 92rpx;
  background: #fff7f6;
  border-radius: 20rpx;
  padding: 0 28rpx;
  margin-bottom: 24rpx;
  font-size: 28rpx;
  border: 1rpx solid #f7dddd;
  box-sizing: border-box;
}

.btn {
  height: 92rpx;
  border-radius: 46rpx;
  font-size: 30rpx;
  margin-top: 20rpx;
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
