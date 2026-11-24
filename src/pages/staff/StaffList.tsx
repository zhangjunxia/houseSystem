import { useEffect, useState } from 'react'
import { Form, Input, Select, Space, Typography, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchStaffsThunk, createStaffThunk, updateStaffThunk, deleteStaffThunk, switchRoleThunk } from '@/store/staffSlice'
import { fetchProjectsThunk } from '@/store/projectSlice'
import ProTable from '@/components/common/ProTable'
import ProModal from '@/components/common/ProModal'
import PermissionButton from '@/components/common/PermissionButton'
import { STAFF_ROLE_LABEL } from '@/types'
import type { Staff, StaffPayload, StaffRole } from '@/types'

const { Title, Text } = Typography

export default function StaffList() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.user.user)!
  const { list, status } = useAppSelector((s) => s.staff)
  const projects = useAppSelector((s) => s.project.list)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form] = Form.useForm()
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchStaffsThunk())
    if (user.permissionLevel === 'company') {
      dispatch(fetchProjectsThunk())
    }
  }, [dispatch, user])

  const projectName = (id: string) => projects.find((p) => p.projectId === id)?.projectName ?? '-'

  const scopeProjects = user.permissionLevel === 'company' ? projects : projects.filter((p) => p.projectId === user.projectId)

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    if (user.permissionLevel === 'project') {
      form.setFieldsValue({ projectId: user.projectId, role: 'consultant' })
    }
    setOpen(true)
  }

  const openEdit = (s: Staff) => {
    setEditing(s)
    form.setFieldsValue({
      staffName: s.staffName,
      phone: s.phone,
      role: s.role,
      projectId: s.projectId,
    })
    setOpen(true)
  }

  const onOk = async () => {
    const values = (await form.validateFields()) as StaffPayload
    setConfirmLoading(true)
    try {
      if (editing) {
        await dispatch(updateStaffThunk({ staffId: editing.staffId, payload: values })).unwrap()
        message.success('人员已更新')
      } else {
        await dispatch(createStaffThunk(values)).unwrap()
        message.success('人员已新增')
      }
      setOpen(false)
      dispatch(fetchStaffsThunk())
    } catch (err) {
      message.error((err as string) || '操作失败')
    } finally {
      setConfirmLoading(false)
    }
  }

  const onDelete = async (s: Staff) => {
    try {
      await dispatch(deleteStaffThunk(s.staffId)).unwrap()
      message.success('人员已删除')
      dispatch(fetchStaffsThunk())
    } catch (err) {
      message.error((err as string) || '删除失败')
    }
  }

  const onSwitchRole = async (s: Staff) => {
    const newRole: StaffRole = s.role === 'supervisor' ? 'consultant' : 'supervisor'
    try {
      await dispatch(switchRoleThunk({ staffId: s.staffId, role: newRole })).unwrap()
      message.success(`已切换为${STAFF_ROLE_LABEL[newRole]}`)
      dispatch(fetchStaffsThunk())
    } catch (err) {
      message.error((err as string) || '切换失败')
    }
  }

  const projectLocked = user.permissionLevel === 'project'
  const roleLocked = user.permissionLevel === 'project'

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          人员配置
        </Title>
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          permission={(u) => u?.permissionLevel === 'company' || u?.permissionLevel === 'project'}
          hideOnNoPermission
          onClick={openCreate}
        >
          新增人员
        </PermissionButton>
      </div>
      <Text type="secondary">
        {user.permissionLevel === 'company'
          ? '全公司销售顾问与销售主管'
          : '本项目销售顾问与销售主管'}
        ，每个项目可配置销售主管与多名销售顾问。
      </Text>

      <ProTable<Staff>
        rowKey="staffId"
        columns={[
          { title: '姓名', dataIndex: 'staffName', width: 120 },
          { title: '联系电话', dataIndex: 'phone', width: 140 },
          {
            title: '角色',
            dataIndex: 'role',
            width: 100,
            render: (v: StaffRole) => (
              <Space>
                <span>{STAFF_ROLE_LABEL[v]}</span>
              </Space>
            ),
          },
          { title: '所属项目', key: 'project', width: 160, render: (_, r) => projectName(r.projectId) },
          { title: '入职日期', dataIndex: 'createTime', width: 120 },
          { title: '在管房源', dataIndex: 'houseCount', align: 'center', width: 90 },
          {
            title: '操作',
            key: 'op',
            width: 220,
            render: (_, r) => (
              <Space size="small">
                <PermissionButton
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  permission={(u) => u?.permissionLevel === 'company' || (u?.permissionLevel === 'project' && u.projectId === r.projectId)}
                  hideOnNoPermission
                  onClick={() => openEdit(r)}
                >
                  编辑
                </PermissionButton>
                <PermissionButton
                  type="link"
                  size="small"
                  icon={<SwapOutlined />}
                  permission={(u) => u?.permissionLevel === 'company' || (u?.permissionLevel === 'project' && u.projectId === r.projectId)}
                  hideOnNoPermission
                  onClick={() => onSwitchRole(r)}
                >
                  切换角色
                </PermissionButton>
                <Popconfirm title="确认删除该人员？" onConfirm={() => onDelete(r)}>
                  <PermissionButton
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    permission={(u) => u?.permissionLevel === 'company' || (u?.permissionLevel === 'project' && u.projectId === r.projectId)}
                    hideOnNoPermission
                  >
                    删除
                  </PermissionButton>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        data={list}
        loading={status === 'loading'}
        page={1}
        pageSize={list.length || 1}
        total={list.length}
        scroll={{x:'max-content',y: 'calc(100vh - 390px)'}}
        onPageChange={() => {}}
      />

      <ProModal
        mode="form"
        open={open}
        title={editing ? '编辑人员' : '新增人员'}
        onOk={onOk}
        onCancel={() => setOpen(false)}
        loading={confirmLoading}
        content={
          <Form form={form} layout="vertical">
            <Form.Item name="staffName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
              <Input placeholder="手机号" />
            </Form.Item>
            <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
              <Select
                disabled={roleLocked}
                options={[
                  { value: 'consultant', label: '销售顾问' },
                  { value: 'supervisor', label: '销售主管' },
                ]}
              />
            </Form.Item>
            <Form.Item name="projectId" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
              <Select
                disabled={projectLocked}
                options={scopeProjects.map((p) => ({ value: p.projectId, label: p.projectName }))}
              />
            </Form.Item>
          </Form>
        }
      />
    </Space>
  )
}
