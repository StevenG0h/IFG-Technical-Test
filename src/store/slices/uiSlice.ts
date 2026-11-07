import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import type { ToastState, ViewMode } from '@/types/ui';

export interface UiState {
  viewMode: ViewMode;
  /** The toast currently on screen. */
  toast: ToastState | null;
  /** Failures/successes waiting behind the visible toast, oldest first. */
  toastQueue: ToastState[];
  isFilterDrawerOpen: boolean;
}

/** Bounded so a burst of failures cannot grow the store without limit. */
export const MAX_QUEUED_TOASTS = 5;

const initialState: UiState = {
  viewMode: 'table',
  toast: null,
  toastQueue: [],
  isFilterDrawerOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    showToast: {
      reducer(state, action: PayloadAction<ToastState>) {
        if (state.toast === null) {
          state.toast = action.payload;
          return;
        }
        if (state.toastQueue.length >= MAX_QUEUED_TOASTS) state.toastQueue.shift();
        state.toastQueue.push(action.payload);
      },
      prepare(payload: Omit<ToastState, 'id'>) {
        return { payload: { ...payload, id: nanoid() } };
      },
    },
    clearToast(state) {
      state.toast = state.toastQueue.shift() ?? null;
    },
    setFilterDrawerOpen(state, action: PayloadAction<boolean>) {
      state.isFilterDrawerOpen = action.payload;
    },
    toggleFilterDrawer(state) {
      state.isFilterDrawerOpen = !state.isFilterDrawerOpen;
    },
  },
});

export const {
  setViewMode,
  showToast,
  clearToast,
  setFilterDrawerOpen,
  toggleFilterDrawer,
} = uiSlice.actions;

export const selectViewMode = (state: { ui: UiState }): ViewMode => state.ui.viewMode;
export const selectToast = (state: { ui: UiState }): ToastState | null => state.ui.toast;
export const selectQueuedToastCount = (state: { ui: UiState }): number =>
  state.ui.toastQueue.length;
export const selectFilterDrawerOpen = (state: { ui: UiState }): boolean =>
  state.ui.isFilterDrawerOpen;

export default uiSlice.reducer;
