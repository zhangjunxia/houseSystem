import { request } from '@/utils/request'
import type {
  House,
  HouseQuery,
  HousePayload,
  HouseStatus,
  PageResult,
  ImportResult,
} from '@/types'

export function fetchHouses(query: HouseQuery): Promise<PageResult<House>> {
  const params: Record<string, string> = {
    page: String(query.page),
    pageSize: String(query.pageSize),
  }
  if (query.projectId) params.projectId = query.projectId
  if (query.layout) params.layout = query.layout
  if (query.areaMin !== undefined) params.areaMin = String(query.areaMin)
  if (query.areaMax !== undefined) params.areaMax = String(query.areaMax)
  if (query.priceMin !== undefined) params.priceMin = String(query.priceMin)
  if (query.priceMax !== undefined) params.priceMax = String(query.priceMax)
  if (query.floor !== undefined) params.floor = String(query.floor)
  if (query.orientation) params.orientation = query.orientation
  if (query.status) params.status = query.status
  if (query.ownerId) params.ownerId = query.ownerId
  if (query.keyword) params.keyword = query.keyword
  return request<PageResult<House>>({ method: 'get', url: '/house/page', params })
}

export function fetchHouseDetail(houseId: string): Promise<House> {
  return request<House>({ method: 'get', url: '/house/detail', params: { houseId } })
}

export function createHouse(payload: HousePayload): Promise<House> {
  return request<House>({ method: 'post', url: '/house/create', data: payload })
}

export function updateHouse(houseId: string, payload: HousePayload): Promise<House> {
  return request<House>({
    method: 'put',
    url: '/house/update',
    data: { houseId, ...payload },
  })
}

export function updateHouseStatus(houseId: string, status: HouseStatus): Promise<House> {
  return request<House>({
    method: 'put',
    url: '/house/status',
    data: { houseId, status },
  })
}

export function importHouses(houses: HousePayload[]): Promise<ImportResult> {
  return request<ImportResult>({ method: 'post', url: '/house/import', data: { houses } })
}

export function exportHouses(query: HouseQuery): Promise<House[]> {
  return request<House[]>({ method: 'post', url: '/house/export', data: query })
}