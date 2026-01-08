export const __DEV__ = process.env.STAGE === 'development'

export const __WEB_FRAME__ = process.env.FRAME

export const __DEV_HOST__ = 'http://localhost:' + getServerPort()

/** 暂时没找到在构建时于命令行中注入环境变量的方法，所以非调试与开发环境下使用更完善的vue版本进行构建 */
export const __WEB_ENTRY_PATH__ = 'web-vue/dist/index.html'

function getServerPort() {
  if (__WEB_FRAME__ === 'vue') {
    return '8080'
  }
  if (__WEB_FRAME__ === 'react') {
    return '5173'
  }
  return '4200'
}
