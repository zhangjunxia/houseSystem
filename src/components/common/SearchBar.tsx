import { Form, Input, InputNumber, Select, Button, Space, Card } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { HouseQuery } from '@/types'

export type FieldType = 'input' | 'select' | 'range' | 'number'

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  /** range 类型最小值字段名 */
  minName?: string
  /** range 类型最大值字段名 */
  maxName?: string
  width?: number
}

interface SearchBarProps {
  fields: FieldConfig[]
  value: Partial<HouseQuery>
  onChange: (q: Partial<HouseQuery>) => void
  onSearch: () => void
  onReset: () => void
}

export default function SearchBar({ fields, value, onChange, onSearch, onReset }: SearchBarProps) {
  const [form] = Form.useForm()

  const handleSearch = () => {
    const v = form.getFieldsValue()
    onChange(v)
    onSearch()
  }

  const handleReset = () => {
    form.resetFields()
    onChange({})
    onReset()
  }

  return (
    <Card size="small">
      <Form form={form} layout="inline" onFinish={handleSearch} initialValues={value}>
        {fields.map((f) => {
          if (f.type === 'range') {
            return (
              <Form.Item key={f.name} label={f.label}>
                <Space.Compact>
                  <Form.Item name={f.minName} noStyle>
                    <InputNumber placeholder="最小" style={{ width: 90 }} />
                  </Form.Item>
                  <span style={{ padding: '0 4px', alignSelf: 'center' }}>-</span>
                  <Form.Item name={f.maxName} noStyle>
                    <InputNumber placeholder="最大" style={{ width: 90 }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            )
          }
          return (
            <Form.Item key={f.name} name={f.name} label={f.label}>
              {f.type === 'input' ? (
                <Input placeholder={f.placeholder} allowClear style={{ width: f.width ?? 140 }} />
              ) : f.type === 'number' ? (
                <InputNumber placeholder={f.placeholder} style={{ width: f.width ?? 120 }} />
              ) : (
                <Select
                  allowClear
                  placeholder={f.placeholder ?? '全部'}
                  style={{ width: f.width ?? 140 }}
                  options={f.options}
                />
              )}
            </Form.Item>
          )
        })}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}