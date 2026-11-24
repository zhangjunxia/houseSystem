import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type {
  House,
  HouseQuery,
  HousePayload,
  HouseStatus,
  PageResult,
  ImportResult,
  AsyncStatus,
} from '@/types'
import {
  fetchHouses,
  fetchHouseDetail,
  createHouse,
  updateHouse,
  updateHouseStatus,
  importHouses,
  exportHouses,
} from '@/services/houseService'

interface HouseState {
  pageResult: PageResult<House>
  query: HouseQuery
  detail: House | null
  status: AsyncStatus
  error: string | null
}

const initialQuery: HouseQuery = { page: 1, pageSize: 20 }

const initialState: HouseState = {
  pageResult: { list: [], total: 0, page: 1, pageSize: 20 },
  query: initialQuery,
  detail: null,
  status: 'idle',
  error: null,
}

export const fetchHousesThunk = createAsyncThunk<PageResult<House>, HouseQuery, { rejectValue: string }>(
  'house/fetchPage',
  async (query, { rejectWithValue }) => {
    try {
      return await fetchHouses(query)
    } catch (err) {
      return rejectWithValue((err as Error).message || '加载房源失败')
    }
  },
)

export const fetchHouseDetailThunk = createAsyncThunk<House, string, { rejectValue: string }>(
  'house/fetchDetail',
  async (houseId, { rejectWithValue }) => {
    try {
      return await fetchHouseDetail(houseId)
    } catch (err) {
      return rejectWithValue((err as Error).message || '加载详情失败')
    }
  },
)

export const createHouseThunk = createAsyncThunk<House, HousePayload, { rejectValue: string }>(
  'house/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await createHouse(payload)
    } catch (err) {
      return rejectWithValue((err as Error).message || '新增房源失败')
    }
  },
)

export const updateHouseThunk = createAsyncThunk<
  House,
  { houseId: string; payload: HousePayload },
  { rejectValue: string }
>('house/update', async ({ houseId, payload }, { rejectWithValue }) => {
  try {
    return await updateHouse(houseId, payload)
  } catch (err) {
    return rejectWithValue((err as Error).message || '更新房源失败')
  }
})

export const updateStatusThunk = createAsyncThunk<
  House,
  { houseId: string; status: HouseStatus },
  { rejectValue: string }
>('house/updateStatus', async ({ houseId, status }, { rejectWithValue }) => {
  try {
    return await updateHouseStatus(houseId, status)
  } catch (err) {
    return rejectWithValue((err as Error).message || '状态修改失败')
  }
})

export const importHousesThunk = createAsyncThunk<ImportResult, HousePayload[], { rejectValue: string }>(
  'house/import',
  async (houses, { rejectWithValue }) => {
    try {
      return await importHouses(houses)
    } catch (err) {
      return rejectWithValue((err as Error).message || '导入失败')
    }
  },
)

export const exportHousesThunk = createAsyncThunk<House[], HouseQuery, { rejectValue: string }>(
  'house/export',
  async (query, { rejectWithValue }) => {
    try {
      return await exportHouses(query)
    } catch (err) {
      return rejectWithValue((err as Error).message || '导出失败')
    }
  },
)

const houseSlice = createSlice({
  name: 'house',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<Partial<HouseQuery>>) {
      state.query = { ...state.query, ...action.payload }
    },
    resetQuery(state) {
      state.query = { ...initialQuery }
    },
    setPage(state, action: PayloadAction<{ page: number; pageSize: number }>) {
      state.query.page = action.payload.page
      state.query.pageSize = action.payload.pageSize
    },
    clearDetail(state) {
      state.detail = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHousesThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchHousesThunk.fulfilled, (state, action: PayloadAction<PageResult<House>>) => {
        state.status = 'succeeded'
        state.pageResult = action.payload
      })
      .addCase(fetchHousesThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? null
      })
      .addCase(fetchHouseDetailThunk.fulfilled, (state, action: PayloadAction<House>) => {
        state.detail = action.payload
      })
  },
})

export const { setQuery, resetQuery, setPage, clearDetail } = houseSlice.actions
export default houseSlice.reducer