import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Project, ProjectPayload, AsyncStatus } from '@/types'
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/services/projectService'

interface ProjectState {
  list: Project[]
  status: AsyncStatus
  error: string | null
}

const initialState: ProjectState = {
  list: [],
  status: 'idle',
  error: null,
}

export const fetchProjectsThunk = createAsyncThunk<Project[], void, { rejectValue: string }>(
  'project/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchProjects()
    } catch (err) {
      return rejectWithValue((err as Error).message || '加载项目失败')
    }
  },
)

export const createProjectThunk = createAsyncThunk<Project, ProjectPayload, { rejectValue: string }>(
  'project/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await createProject(payload)
    } catch (err) {
      return rejectWithValue((err as Error).message || '新增项目失败')
    }
  },
)

export const updateProjectThunk = createAsyncThunk<
  Project,
  { projectId: string; payload: ProjectPayload },
  { rejectValue: string }
>('project/update', async ({ projectId, payload }, { rejectWithValue }) => {
  try {
    return await updateProject(projectId, payload)
  } catch (err) {
    return rejectWithValue((err as Error).message || '更新项目失败')
  }
})

export const deleteProjectThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  'project/delete',
  async (projectId, { rejectWithValue }) => {
    try {
      await deleteProject(projectId)
      return projectId
    } catch (err) {
      return rejectWithValue((err as Error).message || '删除项目失败')
    }
  },
)

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchProjectsThunk.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.status = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchProjectsThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? null
      })
      .addCase(createProjectThunk.fulfilled, (state, action: PayloadAction<Project>) => {
        state.list.push(action.payload)
      })
      .addCase(updateProjectThunk.fulfilled, (state, action: PayloadAction<Project>) => {
        const idx = state.list.findIndex((p) => p.projectId === action.payload.projectId)
        if (idx >= 0) state.list[idx] = action.payload
      })
      .addCase(deleteProjectThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.list = state.list.filter((p) => p.projectId !== action.payload)
      })
  },
})

export default projectSlice.reducer