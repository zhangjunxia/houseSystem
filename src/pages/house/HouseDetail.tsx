import { useEffect, useMemo } from 'react'
import { Button, Card, Descriptions, Space, Tag, Typography, Empty, Image, Spin } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchHouseDetailThunk, clearDetail } from '@/store/houseSlice'
import { fetchProjectsThunk } from '@/store/projectSlice'
import { fetchStaffsThunk } from '@/store/staffSlice'
import HouseStatusTag from '@/components/common/HouseStatusTag'
import PermissionButton from '@/components/common/PermissionButton'
import {
  HOUSE_LAYOUT_LABEL,
  ORIENTATION_LABEL,
  FACILITY_LABEL,
} from '@/types'

const { Title } = Typography

export default function HouseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.user.user)!
  const detail = useAppSelector((s) => s.house.detail)
  const status = useAppSelector((s) => s.house.status)
  const projects = useAppSelector((s) => s.project.list)
  const staffs = useAppSelector((s) => s.staff.list)

  useEffect(() => {
    if (id) dispatch(fetchHouseDetailThunk(id))
    if (user.permissionLevel === 'company') {
      dispatch(fetchProjectsThunk())
      dispatch(fetchStaffsThunk())
    } else if (user.permissionLevel === 'project') {
      dispatch(fetchStaffsThunk())
    }
    return () => {
      dispatch(clearDetail())
    }
  }, [dispatch, id, user])

  const project = useMemo(() => (detail ? projects.find((p) => p.projectId === detail.projectId) : undefined), [detail, projects])
  const staff = useMemo(() => (detail ? staffs.find((s) => s.staffId === detail.ownerId) : undefined), [detail, staffs])

  if (status === 'loading' && !detail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!detail) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/house')}>
          返回
        </Button>
        <Empty description="房源不存在或无权查看" />
      </Space>
    )
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/house')}>
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            房源档案详情
          </Title>
          <HouseStatusTag status={detail.status} />
        </Space>
        <PermissionButton
          type="primary"
          icon={<EditOutlined />}
          permission={(u) => {
            if (u?.permissionLevel === 'company') return true
            if (u?.permissionLevel === 'project') return detail.projectId === u.projectId
            if (u?.permissionLevel === 'consultant') return detail.ownerId === u.staffId
            return false
          }}
          hideOnNoPermission
          onClick={() => navigate(`/house/edit/${detail.houseId}`)}
        >
          编辑
        </PermissionButton>
      </div>

      <Card title="基本信息">
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="房源编号">{detail.houseCode}</Descriptions.Item>
          <Descriptions.Item label="所属项目">{project?.projectName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="户型">{HOUSE_LAYOUT_LABEL[detail.layout]}</Descriptions.Item>
          <Descriptions.Item label="面积(㎡)">{detail.area.toFixed(1)}</Descriptions.Item>
          <Descriptions.Item label="总价(万元)">{detail.totalPrice}</Descriptions.Item>
          <Descriptions.Item label="楼层">{detail.floor} 层</Descriptions.Item>
          <Descriptions.Item label="朝向">{ORIENTATION_LABEL[detail.orientation]}</Descriptions.Item>
          <Descriptions.Item label="负责人">{staff ? `${staff.staffName}（${staff.phone}）` : '-'}</Descriptions.Item>
          <Descriptions.Item label="录入时间">{detail.createTime}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="配套设施">
        <Space size="small" wrap>
          {detail.facilities.length > 0 ? (
            detail.facilities.map((f) => <Tag key={f} color="blue">{FACILITY_LABEL[f]}</Tag>)
          ) : (
            <Empty description="无配套设施" />
          )}
        </Space>
      </Card>

      <Card title="房源图片">
        {detail.images.length > 0 ? (
          <Image.PreviewGroup>
            <Space wrap>
              {detail.images.map((src, i) => (
                <Image key={i} width={200} height={140} src={src} />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <Empty description="暂无图片" />
        )}
      </Card>

      <Card title="备注">
        <Typography.Paragraph>{detail.remark || '无'}</Typography.Paragraph>
      </Card>

      <Card title="所属项目信息" size="small">
        {project ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="项目编码">{project.projectCode}</Descriptions.Item>
            <Descriptions.Item label="项目名称">{project.projectName}</Descriptions.Item>
            <Descriptions.Item label="城市">{project.city}</Descriptions.Item>
            <Descriptions.Item label="创建日期">{project.createTime}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>{project.address}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty />
        )}
      </Card>
    </Space>
  )
}
