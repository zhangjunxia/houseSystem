import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Staff, StaffPayload, StaffRole, AsyncStatus } from '@/types'
import {
  fetchStaffs,
  createStaff,
  updateStaff,
  deleteStaff,
  switchRole,
} from '@/services/staffService'

interface StaffState {
  list: Staff[]
  status: AsyncStatus
  error: string | null
}

const initialState: StaffState = {
  list: [],
  status: 'idle',
  error: null,
}

export const fetchStaffsThunk = createAsyncThunk<Staff[], void, { rejectValue: string }>(
  'staff/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchStaffs()
    } catch (err) {
      return rejectWithValue((err as Error).message || '加载人员失败')
    }
  },
)

export const createStaffThunk = createAsyncThunk<Staff, StaffPayload, { rejectValue: string }>(
  'staff/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await createStaff(payload)
    } catch (err) {
      return rejectWithValue((err as Error).message || '新增人员失败')
    }
  },
)

export const updateStaffThunk = createAsyncThunk<
  Staff,
  { staffId: string; payload: StaffPayload },
  { rejectValue: string }
>('staff/update', async ({ staffId, payload }, { rejectWithValue }) => {
  try {
    return await updateStaff(staffId, payload)
  } catch (err) {
    return rejectWithValue((err as Error).message || '更新人员失败')
  }
})

export const deleteStaffThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  'staff/delete',
  async (staffId, { rejectWithValue }) => {
    try {
      await deleteStaff(staffId)
      return staffId
    } catch (err) {
      return rejectWithValue((err as Error).message || '删除人员失败')
    }
  },
)

export const switchRoleThunk = createAsyncThunk<
  Staff,
  { staffId: string; role: StaffRole },
  { rejectValue: string }
>('staff/switchRole', async ({ staffId, role }, { rejectWithValue }) => {
  try {
    return await switchRole(staffId, role)
  } catch (err) {
    return rejectWithValue((err as Error).message || '角色切换失败')
  }
})

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffsThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchStaffsThunk.fulfilled, (state, action: PayloadAction<Staff[]>) => {
        state.status = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchStaffsThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? null
      })
      .addCase(createStaffThunk.fulfilled, (state, action: PayloadAction<Staff>) => {
        state.list.push(action.payload)
      })
      .addCase(updateStaffThunk.fulfilled, (state, action: PayloadAction<Staff>) => {
        const idx = state.list.findIndex((s) => s.staffId === action.payload.staffId)
        if (idx >= 0) state.list[idx] = action.payload
      })
      .addCase(deleteStaffThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.list = state.list.filter((s) => s.staffId !== action.payload)
      })
      .addCase(switchRoleThunk.fulfilled, (state, action: PayloadAction<Staff>) => {
        const idx = state.list.findIndex((s) => s.staffId === action.payload.staffId)
        if (idx >= 0) state.list[idx] = action.payload
      })
  },
})

export default staffSlice.reducer