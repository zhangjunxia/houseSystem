import { useState } from 'react'
import { Card, Form, Input, Button, Typography, Space, Tag, Divider, message } from 'antd'
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginThunk } from '@/store/userSlice'
import { getDefaultPath } from '@/utils/permission'

const { Title, Text } = Typography

const accounts = [
  { username: 'admin', password: '123456', role: '超级管理员（公司级）', color: 'magenta' },
  { username: 'manager', password: '123456', role: '销售主管（项目级）', color: 'gold' },
  { username: 'consultant', password: '123456', role: '销售顾问（业务员）', color: 'blue' },
]

export default function Login() {
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.user.user)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const result = await dispatch(loginThunk(values)).unwrap()
      message.success('登录成功')
      navigate(getDefaultPath(result.permissionLevel), { replace: true })
    } catch (err) {
      message.error((err as string) || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (a: { username: string; password: string }) => {
    form.setFieldsValue(a)
  }

  if (user) {
    navigate(getDefaultPath(user.permissionLevel), { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1677ff 0%, #001529 100%)',
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} bordered={false}>
        <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center', marginBottom: 16 }}>
          <HomeOutlined style={{ fontSize: 36, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            房源档案管理系统
          </Title>
          <Text type="secondary">三级权限隔离：公司级 / 项目级 / 业务员</Text>
        </Space>

        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: '123456' }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '12px 0' }}>演示账号（点击快速填充）</Divider>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {accounts.map((a) => (
            <div
              key={a.username}
              onClick={() => quickFill(a)}
              style={{
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 6,
                background: '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text code>{a.username}</Text>
              <Tag color={a.color}>{a.role}</Tag>
            </div>
          ))}
        </Space>
      </Card>
    </div>
  )
}
