<template>
  <view style="padding: 20px;">
    <button @click="testRequest">测试接口连通</button>
    <button @click="startRecord" style="margin-top: 12px;">录音检测（5秒）</button>

    <view style="margin-top: 20px;">状态：{{ statusText }}</view>
    <view style="margin-top: 10px;">识别文本：{{ detectText }}</view>
    <view style="margin-top: 10px; word-break: break-all;">服务地址：{{ serverUrl }}</view>
    <view style="margin-top: 10px; word-break: break-all;">录音文件：{{ filePath }}</view>
  </view>
</template>

<script>
const recorderManager = uni.getRecorderManager()
const VOICE_DETECT_URL = 'http://192.168.43.66:8000/api/detect'
const VOICE_DOCS_URL = 'http://192.168.43.66:8000/docs'

export default {
  data() {
    return {
      statusText: '等待开始',
      detectText: '',
      filePath: '',
      serverUrl: VOICE_DETECT_URL
    }
  },

  methods: {
    testRequest() {
      this.statusText = '正在测试接口连通...'

      uni.request({
        url: VOICE_DOCS_URL,
        method: 'GET',
        success: (res) => {
          console.log('request success:', res)
          this.statusText = '普通请求成功，App 能访问后端'
        },
        fail: (err) => {
          console.error('request fail:', err)
          this.statusText = '普通请求失败：' + JSON.stringify(err)
        }
      })
    },

    startRecord() {
      this.statusText = '开始录音，请连续说“救命 救命 救命”'
      this.detectText = ''
      this.filePath = ''

      recorderManager.start({
        duration: 5000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 96000,
        format: 'wav'
      })
    },

    uploadAudio(filePath) {
      this.statusText = '录音完成，正在上传检测...'
      this.filePath = filePath

      console.log('serverUrl =', this.serverUrl)
      console.log('filePath =', filePath)

      uni.uploadFile({
        url: this.serverUrl,
        filePath: filePath,
        name: 'audio_file',
        success: (res) => {
          console.log('upload response:', res)
          console.log('语音模型返回 =', res.data)

          // 先判断 HTTP 状态码
          if (res.statusCode !== 200) {
            this.statusText = `后端返回错误：HTTP ${res.statusCode}`

            try {
              const errData = JSON.parse(res.data)
              console.log('后端错误详情:', errData)
              this.statusText += '，' + (errData.detail || res.data)
            } catch (e) {
              this.statusText += '，' + (res.data || '无详细信息')
            }
            return
          }

          try {
            const data = JSON.parse(res.data)
            this.detectText = data.text || ''
            this.statusText = `检测完成：${data.detected ? '检测到求救' : '未检测到求救'}`

            console.log('识别结果:', data)

            if (data.detected) {
              uni.showModal({
                title: 'SOS 触发',
                content: `检测到关键词：${data.text || '救命'}`,
                showCancel: false
              })
            }
          } catch (e) {
            console.error('返回解析失败:', e, res.data)
            this.statusText = '返回解析失败：' + (res.data || '')
          }
        },
        fail: (err) => {
          console.error('upload fail:', err)
          this.statusText = '上传失败：' + JSON.stringify(err)
        }
      })
    }
  },

  onLoad() {
    recorderManager.onStart(() => {
      console.log('录音开始')
    })

    recorderManager.onStop((res) => {
      console.log('录音结束:', res)

      if (res.tempFilePath) {
        this.uploadAudio(res.tempFilePath)
      } else {
        this.statusText = '没有拿到录音文件'
      }
    })

    recorderManager.onError((err) => {
      console.error('录音失败:', err)
      this.statusText = '录音失败：' + JSON.stringify(err)
    })
  },

  onUnload() {
    try {
      recorderManager.stop()
    } catch (e) {}
  }
}
</script>
