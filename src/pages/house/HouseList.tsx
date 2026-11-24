import { useEffect, useMemo, useState } from 'react'
import { Button, Space, Typography, message, Popconfirm, Upload, Select, Form, Tag } from 'antd'
import type { UploadProps } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchHousesThunk,
  setQuery,
  setPage,
  updateStatusThunk,
  importHousesThunk,
  exportHousesThunk,
} from '@/store/houseSlice'
import { fetchProjectsThunk } from '@/store/projectSlice'
import { fetchStaffsThunk } from '@/store/staffSlice'
import SearchBar, { type FieldConfig } from '@/components/common/SearchBar'
import ProTable from '@/components/common/ProTable'
import ProModal from '@/components/common/ProModal'
import PermissionButton from '@/components/common/PermissionButton'
import HouseStatusTag from '@/components/common/HouseStatusTag'
import {
  HOUSE_STATUS_LABEL,
  HOUSE_LAYOUT_LABEL,
  ORIENTATION_LABEL,
  FACILITY_LABEL,
} from '@/types'
import type { House, HouseStatus, HouseLayout, Orientation, Facility, HousePayload } from '@/types'

const { Title, Text } = Typography

export default function HouseList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.user.user)!
  const { pageResult, query, status } = useAppSelector((s) => s.house)
  const projects = useAppSelector((s) => s.project.list)
  const staffs = useAppSelector((s) => s.staff.list)
  const [statusModal, setStatusModal] = useState<{ open: boolean; house?: House }>({ open: false })
  const [importModal, setImportModal] = useState<{ open: boolean; result?: string }>({ open: false })
  const [statusForm] = Form.useForm()

  useEffect(() => {
    if (user.permissionLevel === 'company') {
      dispatch(fetchProjectsThunk())
      dispatch(fetchStaffsThunk())
    } else if (user.permissionLevel === 'project') {
      dispatch(fetchStaffsThunk())
    }
    dispatch(fetchHousesThunk({ ...query, page: 1, pageSize: 20 }))
  }, [dispatch, user])

  const scopeProjects = useMemo(() => {
    if (user.permissionLevel === 'company') return projects
    return projects.filter((p) => p.projectId === user.projectId)
  }, [projects, user])

  const scopeStaffs = useMemo(() => {
    if (user.permissionLevel === 'company') return staffs.filter((s) => s.role === 'consultant')
    if (user.permissionLevel === 'project') return staffs.filter((s) => s.role === 'consultant' && s.projectId === user.projectId)
    return staffs.filter((s) => s.staffId === user.staffId)
  }, [staffs, user])

  const projectName = (id: string) => projects.find((p) => p.projectId === id)?.projectName ?? '-'
  const staffName = (id: string) => staffs.find((s) => s.staffId === id)?.staffName ?? '-'

  const fields: FieldConfig[] = [
    {
      name: 'keyword',
      label: '关键字',
      type: 'input',
      placeholder: '房源编号',
      width: 160,
    },
    {
      name: 'projectId',
      label: '项目',
      type: 'select',
      placeholder: '全部项目',
      options: scopeProjects.map((p) => ({ value: p.projectId, label: p.projectName })),
      width: 150,
    },
    {
      name: 'layout',
      label: '户型',
      type: 'select',
      placeholder: '全部户型',
      options: Object.entries(HOUSE_LAYOUT_LABEL).map(([k, v]) => ({ value: k, label: v })),
      width: 130,
    },
    {
      name: 'areaRange',
      label: '面积(㎡)',
      type: 'range',
      minName: 'areaMin',
      maxName: 'areaMax',
    },
    {
      name: 'priceRange',
      label: '总价(万)',
      type: 'range',
      minName: 'priceMin',
      maxName: 'priceMax',
    },
    {
      name: 'orientation',
      label: '朝向',
      type: 'select',
      placeholder: '全部朝向',
      options: Object.entries(ORIENTATION_LABEL).map(([k, v]) => ({ value: k, label: v })),
      width: 120,
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部状态',
      options: Object.entries(HOUSE_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v })),
      width: 100,
    },
  ]

  const onSearch = () => {
    dispatch(fetchHousesThunk({ ...query, page: 1 }))
  }

  const onReset = () => {
    dispatch(setPage({ page: 1, pageSize: query.pageSize }))
    dispatch(fetchHousesThunk({ page: 1, pageSize: query.pageSize }))
  }

  const onFilterChange = (q: Partial<typeof query>) => {
    dispatch(setQuery(q))
  }

  const onPageChange = (page: number, pageSize: number) => {
    dispatch(setPage({ page, pageSize }))
    dispatch(fetchHousesThunk({ ...query, page, pageSize }))
  }

  const openStatusModal = (house: House) => {
    statusForm.setFieldsValue({ status: house.status })
    setStatusModal({ open: true, house })
  }

  const onStatusOk = async () => {
    const values = (await statusForm.validateFields()) as { status: HouseStatus }
    if (!statusModal.house) return
    try {
      await dispatch(updateStatusThunk({ houseId: statusModal.house.houseId, status: values.status })).unwrap()
      message.success('状态修改成功')
      setStatusModal({ open: false })
      dispatch(fetchHousesThunk(query))
    } catch (err) {
      message.error((err as string) || '状态修改失败')
    }
  }

  const onDelete = async (h: House) => {
    try {
      await dispatch(updateStatusThunk({ houseId: h.houseId, status: h.status })).unwrap()
      message.success('操作成功')
      dispatch(fetchHousesThunk(query))
    } catch (err) {
      message.error((err as string) || '操作失败')
    }
  }

  const onExport = async () => {
    try {
      const data = await dispatch(exportHousesThunk(query)).unwrap()
      const ws = XLSX.utils.json_to_sheet(
        data.map((h) => ({
          房源编号: h.houseCode,
          所属项目: projectName(h.projectId),
          户型: h.layout,
          面积: h.area,
          总价: h.totalPrice,
          楼层: h.floor,
          朝向: h.orientation,
          配套: h.facilities.join(','),
          负责人: staffName(h.ownerId),
          状态: h.status,
          录入时间: h.createTime,
          备注: h.remark,
        })),
      )
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '房源档案')
      XLSX.writeFile(wb, `房源档案_${new Date().toISOString().slice(0, 10)}.xlsx`)
      message.success(`已导出 ${data.length} 条`)
    } catch (err) {
      message.error((err as string) || '导出失败')
    }
  }

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
          const houses: HousePayload[] = rows.map((row) => ({
            houseCode: String(row['房源编号'] ?? ''),
            projectId: scopeProjects[0]?.projectId ?? '',
            layout: String(row['户型'] ?? '三居室') as HouseLayout,
            area: Number(row['面积'] ?? 0),
            totalPrice: Number(row['总价'] ?? 0),
            floor: Number(row['楼层'] ?? 1),
            orientation: String(row['朝向'] ?? '南') as Orientation,
            facilities: String(row['配套'] ?? '').split(',').filter(Boolean) as Facility[],
            ownerId: user.staffId ?? scopeStaffs[0]?.staffId ?? '',
            status: (String(row['状态'] ?? '待售') as HouseStatus) || '待售',
            images: [],
            remark: String(row['备注'] ?? ''),
          }))
          const result = await dispatch(importHousesThunk(houses)).unwrap()
          setImportModal({
            open: true,
            result: `成功导入 ${result.successCount} 条，失败 ${result.failDetails.length} 条\n${result.failDetails.map((f) => `第${f.row}行: ${f.reason}`).join('\n')}`,
          })
          dispatch(fetchHousesThunk(query))
        } catch (err) {
          message.error((err as string) || '导入失败')
        }
      }
      reader.readAsArrayBuffer(file)
      return false
    },
  }

  const canDelete = (h: House) => {
    if (user.permissionLevel === 'company') return true
    if (user.permissionLevel === 'project') return h.projectId === user.projectId
    return false
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          房源档案
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/house/create')}>
            录入房源
          </Button>
          <Upload {...uploadProps}>
            <Button icon={<ImportOutlined />}>批量导入</Button>
          </Upload>
          <Button icon={<ExportOutlined />} onClick={onExport}>
            批量导出
          </Button>
        </Space>
      </div>
      <Text type="secondary">
        {user.permissionLevel === 'company'
          ? '全公司房源档案'
          : user.permissionLevel === 'project'
            ? `本项目房源档案`
            : '我负责的房源档案'}
      </Text>

      <SearchBar
        fields={fields}
        value={query}
        onChange={onFilterChange}
        onSearch={onSearch}
        onReset={onReset}
      />

      <ProTable<House>
        rowKey="houseId"
        scroll={{ x: 1400 }}
        virtual={query.pageSize >= 100}
        columns={[
          { title: '房源编号', dataIndex: 'houseCode', fixed: 'left', width: 180 },
          { title: '项目', key: 'project', width: 140, render: (_, r) => projectName(r.projectId) },
          { title: '户型', dataIndex: 'layout', width: 100, render: (v: HouseLayout) => HOUSE_LAYOUT_LABEL[v] },
          { title: '面积(㎡)', dataIndex: 'area', width: 100, align: 'right', render: (v: number) => v.toFixed(1) },
          { title: '总价(万)', dataIndex: 'totalPrice', width: 100, align: 'right' },
          { title: '楼层', dataIndex: 'floor', width: 70, align: 'center' },
          { title: '朝向', dataIndex: 'orientation', width: 90, render: (v: Orientation) => ORIENTATION_LABEL[v] },
          {
            title: '配套',
            dataIndex: 'facilities',
            width: 160,
            render: (v: Facility[]) => (
              <Space size={2} wrap>
                {v.map((f) => (
                  <Tag key={f}>{FACILITY_LABEL[f]}</Tag>
                ))}
              </Space>
            ),
          },
          { title: '负责人', key: 'owner', width: 100, render: (_, r) => staffName(r.ownerId) },
          {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            align: 'center',
            render: (v: HouseStatus) => <HouseStatusTag status={v} />,
          },
          { title: '录入时间', dataIndex: 'createTime', width: 120 },
          {
            title: '操作',
            key: 'op',
            fixed: 'right',
            width: 260,
            render: (_, r) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/house/detail/${r.houseId}`)}>
                  详情
                </Button>
                <PermissionButton
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  permission={(u) => {
                    if (u?.permissionLevel === 'company') return true
                    if (u?.permissionLevel === 'project') return r.projectId === u.projectId
                    if (u?.permissionLevel === 'consultant') return r.ownerId === u.staffId
                    return false
                  }}
                  hideOnNoPermission
                  onClick={() => navigate(`/house/edit/${r.houseId}`)}
                >
                  编辑
                </PermissionButton>
                <Button type="link" size="small" onClick={() => openStatusModal(r)}>
                  状态
                </Button>
                {canDelete(r) && (
                  <Popconfirm title="确认删除该房源档案？" onConfirm={() => onDelete(r)}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
        data={pageResult.list}
        loading={status === 'loading'}
        page={pageResult.page}
        pageSize={pageResult.pageSize}
        total={pageResult.total}
        onPageChange={onPageChange}
      />

      <ProModal
        mode="form"
        open={statusModal.open}
        title="修改房源状态"
        onOk={onStatusOk}
        onCancel={() => setStatusModal({ open: false })}
        content={
          <Form form={statusForm} layout="vertical">
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: '待售', label: '待售' },
                  { value: '已售', label: '已售' },
                  { value: '锁定', label: '锁定' },
                ]}
              />
            </Form.Item>
          </Form>
        }
      />

      <ProModal
        mode="detail"
        open={importModal.open}
        title="导入结果"
        onOk={() => setImportModal({ open: false })}
        onCancel={() => setImportModal({ open: false })}
        confirmText="知道了"
        content={<Text style={{ whiteSpace: 'pre-wrap' }}>{importModal.result}</Text>}
      />
    </Space>
  )
}
