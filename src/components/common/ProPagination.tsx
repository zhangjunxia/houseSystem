import { Pagination } from 'antd'

interface ProPaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  pageSizeOptions?: string[]
}

export default function ProPagination({
  page,
  pageSize,
  total,
  onChange,
  pageSizeOptions = ['10', '20', '50', '100'],
}: ProPaginationProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        showSizeChanger
        showQuickJumper
        showTotal={(t) => `共 ${t} 条`}
        pageSizeOptions={pageSizeOptions}
        onChange={onChange}
      />
    </div>
  )
}