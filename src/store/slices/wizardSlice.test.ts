import { describe, expect, it } from 'vitest';
import type { ProductDraft } from '@/types/product';
import { createEmptyDraft } from '@/utils/productDraft';
import wizardReducer, {
  clearDraft,
  saveDraft,
  selectCurrentStep,
  setCurrentStep,
  setSubmitted,
  WIZARD_TOTAL_STEPS,
} from '@/store/slices/wizardSlice';

const draft: ProductDraft = { ...createEmptyDraft(), title: 'Draft product' };

describe('wizardSlice', () => {
  it('clamps the current step to the wizard bounds', () => {
    expect(wizardReducer(undefined, setCurrentStep(-3)).currentStep).toBe(0);
    expect(wizardReducer(undefined, setCurrentStep(99)).currentStep).toBe(
      WIZARD_TOTAL_STEPS - 1,
    );
    expect(wizardReducer(undefined, setCurrentStep(2)).currentStep).toBe(2);
  });

  it('saves and clears a draft', () => {
    const saved = wizardReducer(undefined, saveDraft(draft));
    expect(saved.draft).toEqual(draft);
    expect(saved.hasDraft).toBe(true);

    const cleared = wizardReducer(saved, clearDraft());
    expect(cleared.draft).toBeNull();
    expect(cleared.hasDraft).toBe(false);
    expect(cleared.currentStep).toBe(0);
  });

  it('tracks the submitted flag and resets it with the draft', () => {
    const submitted = wizardReducer(undefined, setSubmitted(true));
    expect(submitted.submitted).toBe(true);
    expect(wizardReducer(submitted, clearDraft()).submitted).toBe(false);
  });

  it('exposes a currentStep selector whose value survives draft saves', () => {
    const before = wizardReducer(undefined, setCurrentStep(2));
    const after = wizardReducer(before, saveDraft(draft));

    // The slice object changes, so subscribing to the whole slice would
    // re-render the wizard shell on every autosave. The primitive selection
    // does not change, which is what keeps the form rows untouched.
    expect(after).not.toBe(before);
    expect(selectCurrentStep({ wizard: after })).toBe(selectCurrentStep({ wizard: before }));
  });
});
