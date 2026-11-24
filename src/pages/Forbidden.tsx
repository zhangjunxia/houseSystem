import { Result, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { getDefaultPath } from '@/utils/permission'

export default function Forbidden() {
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.user.user)
  const defaultPath = user ? getDefaultPath(user.permissionLevel) : '/login'

  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您无权访问该页面。"
      extra={
        <Space>
          <Button type="primary" onClick={() => navigate(defaultPath)}>
            返回首页
          </Button>
          <Button onClick={() => navigate(-1)}>返回上一页</Button>
        </Space>
      }
    />
  )
}