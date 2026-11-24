import { Modal } from 'antd'
import type { ReactNode } from 'react'

export type ProModalMode = 'form' | 'confirm' | 'detail'

interface ProModalProps {
  mode: ProModalMode
  open: boolean
  title: string
  onOk?: () => void
  onCancel: () => void
  content?: ReactNode
  confirmText?: string
  cancelText?: string
  width?: number
  loading?: boolean
}

export default function ProModal({
  mode,
  open,
  title,
  onOk,
  onCancel,
  content,
  confirmText = '确定',
  cancelText = '取消',
  width = 520,
  loading = false,
}: ProModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={width}
      confirmLoading={loading}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{ danger: mode === 'confirm' }}
      destroyOnClose
    >
      {content}
    </Modal>
  )
}