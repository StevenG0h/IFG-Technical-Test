import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProductWriteOverlay } from '@/store/api/productWriteOverlay';

export interface WritesState {
  /**
   * Mirror of the persisted write overlay. It lives in Redux so the URL sync can
   * put it in the shareable link; the fetched data itself still reads the
   * persisted copy.
   */
  overlay: ProductWriteOverlay;
}

const initialState: WritesState = {
  overlay: { updates: {}, deleted: [] },
};

const writesSlice = createSlice({
  name: 'writes',
  initialState,
  reducers: {
    setWriteOverlay(state, action: PayloadAction<ProductWriteOverlay>) {
      state.overlay = action.payload;
    },
  },
});

export const { setWriteOverlay } = writesSlice.actions;

export const selectWriteOverlay = (state: { writes: WritesState }): ProductWriteOverlay =>
  state.writes.overlay;

export default writesSlice.reducer;
