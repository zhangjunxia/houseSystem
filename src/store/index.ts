import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import projectReducer from './projectSlice'
import staffReducer from './staffSlice'
import houseReducer from './houseSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    project: projectReducer,
    staff: staffReducer,
    house: houseReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  devTools: true,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch