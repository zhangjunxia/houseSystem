import { useEffect, useState } from 'react'
import { Form, Input, Space, Typography, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchProjectsThunk,
  createProjectThunk,
  updateProjectThunk,
  deleteProjectThunk,
} from '@/store/projectSlice'
import ProTable from '@/components/common/ProTable'
import ProModal from '@/components/common/ProModal'
import PermissionButton from '@/components/common/PermissionButton'
import type { Project, ProjectPayload } from '@/types'

const { Title, Text } = Typography

export default function ProjectList() {
  const dispatch = useAppDispatch()
  const { list, status } = useAppSelector((s) => s.project)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form] = Form.useForm()
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchProjectsThunk())
  }, [dispatch])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const openEdit = (p: Project) => {
    setEditing(p)
    form.setFieldsValue({
      projectCode: p.projectCode,
      projectName: p.projectName,
      city: p.city,
      address: p.address,
    })
    setOpen(true)
  }

  const onOk = async () => {
    const values = (await form.validateFields()) as ProjectPayload
    setConfirmLoading(true)
    try {
      if (editing) {
        await dispatch(updateProjectThunk({ projectId: editing.projectId, payload: values })).unwrap()
        message.success('项目已更新')
      } else {
        await dispatch(createProjectThunk(values)).unwrap()
        message.success('项目已创建')
      }
      setOpen(false)
      dispatch(fetchProjectsThunk())
    } catch (err) {
      message.error((err as string) || '操作失败')
    } finally {
      setConfirmLoading(false)
    }
  }

  const onDelete = async (p: Project) => {
    try {
      await dispatch(deleteProjectThunk(p.projectId)).unwrap()
      message.success('项目已删除')
      dispatch(fetchProjectsThunk())
    } catch (err) {
      message.error((err as string) || '删除失败')
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          项目管理
        </Title>
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          permission={(u) => u?.permissionLevel === 'company'}
          hideOnNoPermission
          onClick={openCreate}
        >
          新增项目
        </PermissionButton>
      </div>
      <Text type="secondary">公司下多个项目组，每个项目可配置销售主管与销售顾问。</Text>

      <ProTable<Project>
        rowKey="projectId"
        columns={[
          { title: '项目编码', dataIndex: 'projectCode', width: 120 },
          { title: '项目名称', dataIndex: 'projectName', width: 160 },
          { title: '城市', dataIndex: 'city', width: 100 },
          { title: '地址', dataIndex: 'address', ellipsis: true },
          { title: '主管数', dataIndex: 'supervisorCount', align: 'center', width: 80 },
          { title: '顾问数', dataIndex: 'consultantCount', align: 'center', width: 80 },
          { title: '房源数', dataIndex: 'houseCount', align: 'center', width: 80 },
          { title: '创建日期', dataIndex: 'createTime', width: 120 },
          {
            title: '操作',
            key: 'op',
            width: 160,
            render: (_, r) => (
              <Space size="small">
                <PermissionButton
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  permission={(u) => u?.permissionLevel === 'company'}
                  hideOnNoPermission
                  onClick={() => openEdit(r)}
                >
                  编辑
                </PermissionButton>
                <Popconfirm title="确认删除该项目？" onConfirm={() => onDelete(r)}>
                  <PermissionButton
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    permission={(u) => u?.permissionLevel === 'company'}
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
        onPageChange={() => {}}
      />

      <ProModal
        mode="form"
        open={open}
        title={editing ? '编辑项目' : '新增项目'}
        onOk={onOk}
        onCancel={() => setOpen(false)}
        loading={confirmLoading}
        width={560}
        content={
          <Form form={form} layout="vertical">
            <Form.Item name="projectCode" label="项目编码" rules={[{ required: true, message: '请输入项目编码' }]}>
              <Input placeholder="如 FCY" />
            </Form.Item>
            <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
              <Input placeholder="如 翡翠花园" />
            </Form.Item>
            <Form.Item name="city" label="城市" rules={[{ required: true, message: '请输入城市' }]}>
              <Input placeholder="城市" />
            </Form.Item>
            <Form.Item name="address" label="项目地址" rules={[{ required: true, message: '请输入项目地址' }]}>
              <Input placeholder="项目地址" />
            </Form.Item>
          </Form>
        }
      />
    </Space>
  )
}
