import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchHouseDetailThunk, createHouseThunk, updateHouseThunk } from '@/store/houseSlice'
import { fetchProjectsThunk } from '@/store/projectSlice'
import { fetchStaffsThunk } from '@/store/staffSlice'
import {
  HOUSE_LAYOUT_LABEL,
  ORIENTATION_LABEL,
  FACILITY_LABEL,
} from '@/types'
import type { HousePayload } from '@/types'

const { Title, Text } = Typography

export default function HouseForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.user.user)!
  const detail = useAppSelector((s) => s.house.detail)
  const projects = useAppSelector((s) => s.project.list)
  const staffs = useAppSelector((s) => s.staff.list)
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [imageList, setImageList] = useState<string[]>([])

  useEffect(() => {
    if (user.permissionLevel === 'company') {
      dispatch(fetchProjectsThunk())
      dispatch(fetchStaffsThunk())
    } else if (user.permissionLevel === 'project') {
      dispatch(fetchStaffsThunk())
    }
    if (isEdit && id) {
      dispatch(fetchHouseDetailThunk(id))
    }
  }, [dispatch, id, isEdit, user])

  useEffect(() => {
    if (isEdit && detail) {
      form.setFieldsValue({
        houseCode: detail.houseCode,
        projectId: detail.projectId,
        layout: detail.layout,
        area: detail.area,
        totalPrice: detail.totalPrice,
        floor: detail.floor,
        orientation: detail.orientation,
        facilities: detail.facilities,
        ownerId: detail.ownerId,
        status: detail.status,
        remark: detail.remark,
      })
      setImageList(detail.images)
    } else if (!isEdit) {
      const initProjectId = user.permissionLevel === 'company' ? projects[0]?.projectId : user.projectId
      form.setFieldsValue({
        projectId: initProjectId,
        layout: '三居室',
        area: 100,
        totalPrice: 500,
        floor: 1,
        orientation: '南',
        facilities: [],
        ownerId: user.staffId,
        status: '待售',
        remark: '',
      })
    }
  }, [detail, form, isEdit, projects, user])

  const scopeProjects = useMemo(() => {
    if (user.permissionLevel === 'company') return projects
    return projects.filter((p) => p.projectId === user.projectId)
  }, [projects, user])

  const scopeStaffs = useMemo(() => {
    if (user.permissionLevel === 'company') return staffs.filter((s) => s.role === 'consultant')
    if (user.permissionLevel === 'project') return staffs.filter((s) => s.role === 'consultant' && s.projectId === user.projectId)
    return staffs.filter((s) => s.staffId === user.staffId)
  }, [staffs, user])

  const projectLocked = user.permissionLevel !== 'company'
  const ownerLocked = user.permissionLevel === 'consultant'

  const uploadProps: UploadProps = {
    listType: 'picture-card',
    showUploadList: true,
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageList((prev) => [...prev, e.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
      return false
    },
    onRemove: (_file) => {
      setImageList((prev) => prev.slice(0, -1))
      return true
    },
  }

  const onSave = async () => {
    const values = (await form.validateFields()) as HousePayload
    setSaving(true)
    const payload: HousePayload = {
      ...values,
      area: Number(values.area),
      totalPrice: Number(values.totalPrice),
      floor: Number(values.floor),
      facilities: values.facilities || [],
      images: imageList,
      remark: values.remark || '',
      ownerId: user.permissionLevel === 'consultant' && user.staffId ? user.staffId : values.ownerId,
      projectId: user.permissionLevel === 'project' && user.projectId ? user.projectId : values.projectId,
    }
    try {
      if (isEdit && id) {
        await dispatch(updateHouseThunk({ houseId: id, payload })).unwrap()
        message.success('房源已更新')
      } else {
        await dispatch(createHouseThunk(payload)).unwrap()
        message.success('房源已录入')
      }
      navigate('/house')
    } catch (err) {
      message.error((err as string) || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/house')}>
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {isEdit ? '编辑房源档案' : '录入房源档案'}
          </Title>
        </Space>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
          保存
        </Button>
      </div>
      <Text type="secondary">带 * 为必填项。</Text>

      <Form form={form} layout="vertical">
        <Card title="基本信息">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="houseCode" label="房源编号" rules={[{ required: true, message: '请输入房源编号' }]}>
                <Input placeholder="如 FCY-0101-0101" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="projectId" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
                <Select
                  disabled={projectLocked}
                  options={scopeProjects.map((p) => ({ value: p.projectId, label: p.projectName }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="layout" label="户型" rules={[{ required: true, message: '请选择户型' }]}>
                <Select options={Object.entries(HOUSE_LAYOUT_LABEL).map(([k, v]) => ({ value: k, label: v }))} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="area" label="面积(㎡)" rules={[{ required: true, message: '请输入面积' }]}>
                <InputNumber min={1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="totalPrice" label="总价(万)" rules={[{ required: true, message: '请输入总价' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="floor" label="楼层" rules={[{ required: true, message: '请输入楼层' }]}>
                <InputNumber min={-3} max={99} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="orientation" label="朝向" rules={[{ required: true, message: '请选择朝向' }]}>
                <Select options={Object.entries(ORIENTATION_LABEL).map(([k, v]) => ({ value: k, label: v }))} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="配套与负责" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="facilities" label="配套设施">
                <Select
                  mode="multiple"
                  placeholder="选择配套设施"
                  options={Object.entries(FACILITY_LABEL).map(([k, v]) => ({ value: k, label: v }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="ownerId" label="负责销售顾问" rules={[{ required: true, message: '请选择负责人' }]}>
                <Select
                  disabled={ownerLocked}
                  placeholder="选择销售顾问"
                  options={scopeStaffs.map((s) => ({ value: s.staffId, label: `${s.staffName}（${s.phone}）` }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label="房源状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select
                  options={[
                    { value: '待售', label: '待售' },
                    { value: '已售', label: '已售' },
                    { value: '锁定', label: '锁定' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="房源图片" style={{ marginTop: 16 }}>
          <Upload {...uploadProps}>
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传图片</div>
            </div>
          </Upload>
        </Card>

        <Card title="备注" style={{ marginTop: 16 }}>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>
        </Card>
      </Form>
    </Space>
  )
}
