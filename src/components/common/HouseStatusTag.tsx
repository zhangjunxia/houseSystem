import { Tag } from 'antd'
import type { HouseStatus } from '@/types'

const colorMap: Record<HouseStatus, string> = {
  待售: 'green',
  已售: 'default',
  锁定: 'orange',
}

export default function HouseStatusTag({ status }: { status: HouseStatus }) {
  return <Tag color={colorMap[status]}>{status}</Tag>
}