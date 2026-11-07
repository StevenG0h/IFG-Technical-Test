import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProductDraft } from '@/types/product';

export const WIZARD_TOTAL_STEPS = 4;

export interface WizardState {
  currentStep: number;
  draft: ProductDraft | null;
  hasDraft: boolean;
  submitted: boolean;
}

const initialState: WizardState = {
  currentStep: 0,
  draft: null,
  hasDraft: false,
  submitted: false,
};

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    setCurrentStep(state, action: PayloadAction<number>) {
      const clamped = Math.min(Math.max(action.payload, 0), WIZARD_TOTAL_STEPS - 1);
      state.currentStep = clamped;
    },
    saveDraft(state, action: PayloadAction<ProductDraft>) {
      state.draft = action.payload;
      state.hasDraft = true;
    },
    clearDraft(state) {
      state.draft = null;
      state.hasDraft = false;
      state.currentStep = 0;
      state.submitted = false;
    },
    setSubmitted(state, action: PayloadAction<boolean>) {
      state.submitted = action.payload;
    },
  },
});

export const { setCurrentStep, saveDraft, clearDraft, setSubmitted } = wizardSlice.actions;

export const selectWizard = (state: { wizard: WizardState }): WizardState => state.wizard;

/** Narrow selectors: subscribing to the whole slice would re-render on every draft save. */
export const selectCurrentStep = (state: { wizard: WizardState }): number =>
  state.wizard.currentStep;
export const selectWizardDraft = (state: { wizard: WizardState }): ProductDraft | null =>
  state.wizard.draft;

export default wizardSlice.reducer;
