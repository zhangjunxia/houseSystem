import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCNStar from 'antd/locale/zh_CN'

// 兼容 Vite 8 ESM/CJS interop：antd locale 导出为 { default: {...} }
const zhCN = (zhCNStar as { default?: typeof zhCNStar }).default ?? zhCNStar
import { Provider } from 'react-redux'
import { store } from './store'
import { setupMock } from './mock'
import App from './App'
import 'antd/dist/reset.css'

setupMock()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
)
