import { useMemo } from 'react'
import { Layout, Menu, Dropdown, Avatar, Space, Typography, Tag, Breadcrumb } from 'antd'
import {
  ApartmentOutlined,
  TeamOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutThunk } from '@/store/userSlice'
import { getMenusByPermission } from '@/utils/permission'
import { PERMISSION_LEVEL_LABEL } from '@/types'
import type { MenuItem } from '@/types'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const iconMap: Record<string, React.ReactNode> = {
  ApartmentOutlined: <ApartmentOutlined />,
  TeamOutlined: <TeamOutlined />,
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
}

export default function BasicLayout() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.user.user)
  const navigate = useNavigate()
  const location = useLocation()

  const items = useMemo<MenuItem[]>(() => {
    if (!user) return []
    return getMenusByPermission(user.permissionLevel)
  }, [user])

  const selectedKey = useMemo(() => {
    const path = '/' + location.pathname.split('/')[1]
    const matched = items.find((m) => m.path === path)
    return matched?.key ?? ''
  }, [location, items])

  const breadcrumbItems = useMemo(() => {
    const path = '/' + location.pathname.split('/')[1]
    const matched = items.find((m) => m.path === path)
    return [
      { title: '首页' },
      ...(matched ? [{ title: matched.label }] : []),
    ]
  }, [location, items])

  if (!user) return null

  const roleColor =
    user.permissionLevel === 'company' ? 'magenta' : user.permissionLevel === 'project' ? 'gold' : 'blue'

  const handleLogout = () => {
    dispatch(logoutThunk())
    navigate('/login', { replace: true })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} style={{ background: '#001529' }}>
        <div
          style={{
            height: 56,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 1,
          }}
        >
          房源档案管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items.map((m) => ({ key: m.key, icon: iconMap[m.icon], label: m.label }))}
          onClick={({ key }) => {
            const target = items.find((m) => m.key === key)
            if (target) navigate(target.path)
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Space.Compact direction="vertical" style={{ display: 'flex' }}>
            <Text strong style={{ fontSize: 16 }}>
              房源档案管理系统
            </Text>
            <Breadcrumb items={breadcrumbItems} />
          </Space.Compact>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
              <span>{user.realName}</span>
              <Tag color={roleColor}>{PERMISSION_LEVEL_LABEL[user.permissionLevel]}</Tag>
              <DownOutlined />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
