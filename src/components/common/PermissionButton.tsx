import type { ReactNode } from 'react'
import { Button } from 'antd'
import { useAppSelector } from '@/store/hooks'
import type { User } from '@/types'

interface PermissionButtonProps {
  permission: (user: User | null) => boolean
  children: ReactNode
  disabled?: boolean
  hideOnNoPermission?: boolean
  onClick?: () => void
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  danger?: boolean
  icon?: ReactNode
  size?: 'large' | 'middle' | 'small'
}

export default function PermissionButton({
  permission,
  children,
  disabled,
  hideOnNoPermission = false,
  onClick,
  type = 'default',
  danger,
  icon,
  size,
}: PermissionButtonProps) {
  const user = useAppSelector((s) => s.user.user)
  const allowed = permission(user)

  if (!allowed && hideOnNoPermission) return null
  if (!allowed) {
    return (
      <Button type={type} danger={danger} icon={icon} size={size} disabled>
        {children}
      </Button>
    )
  }
  return (
    <Button type={type} danger={danger} icon={icon} size={size} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  )
}