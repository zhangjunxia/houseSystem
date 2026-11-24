import { Table, Card, Empty } from 'antd'
import type { TableProps } from 'antd'
import ProPagination from './ProPagination'

interface ProTableProps<T> {
  columns: TableProps<T>['columns']
  data: T[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  rowKey: string
  onPageChange: (page: number, pageSize: number) => void
  scroll?: TableProps<T>['scroll']
  virtual?: boolean
  pageSizeOptions?: string[]
}

export default function ProTable<T>({
  columns,
  data,
  loading,
  page,
  pageSize,
  total,
  rowKey,
  onPageChange,
  scroll,
  virtual,
  pageSizeOptions,
}: ProTableProps<T>) {
  return (
    <Card>
      <Table<T>
        rowKey={rowKey as never}
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={scroll}
        virtual={virtual}
        pagination={false}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
      />
      <ProPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={onPageChange}
        pageSizeOptions={pageSizeOptions}
      />
    </Card>
  )
}