import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { User, LoginResult, AsyncStatus } from '@/types'
import { login as loginApi } from '@/services/authService'
import { persistAuth, clearAuth, getStoredUser, getStoredToken } from '@/utils/request'

interface UserState {
  user: User | null
  token: string | null
  status: AsyncStatus
  error: string | null
}

/** 从 localStorage 恢复登录态 */
function loadInitialState(): UserState {
  const storedUser = getStoredUser<LoginResult>()
  const storedToken = getStoredToken()
  if (storedUser && storedToken) {
    return {
      user: {
        userId: storedUser.userId,
        username: storedUser.username,
        password: '',
        realName: storedUser.realName,
        permissionLevel: storedUser.permissionLevel,
        projectId: storedUser.projectId,
        staffId: storedUser.staffId,
        token: storedToken,
        menus: storedUser.menus,
      },
      token: storedToken,
      status: 'idle',
      error: null,
    }
  }
  return { user: null, token: null, status: 'idle', error: null }
}

/** 登录 thunk */
export const loginThunk = createAsyncThunk<
  LoginResult,
  { username: string; password: string },
  { rejectValue: string }
>('user/login', async (payload, { rejectWithValue }) => {
  try {
    const result = await loginApi(payload.username, payload.password)
    persistAuth(result, result.token)
    return result
  } catch (err) {
    return rejectWithValue((err as Error).message || '登录失败')
  }
})

/** 登出 thunk */
export const logoutThunk = createAsyncThunk<void, void>('user/logout', async () => {
  clearAuth()
})

const userSlice = createSlice({
  name: 'user',
  initialState: loadInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<LoginResult>) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.user = {
          userId: action.payload.userId,
          username: action.payload.username,
          password: '',
          realName: action.payload.realName,
          permissionLevel: action.payload.permissionLevel,
          projectId: action.payload.projectId,
          staffId: action.payload.staffId,
          token: action.payload.token,
          menus: action.payload.menus,
        }
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || '登录失败'
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.status = 'idle'
        state.error = null
      })
  },
})

export default userSlice.reducer