'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, type Path } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { productDraftSchema, type ProductFormValues } from '@/schemas/productSchemas';
import { useAddProductMutation } from '@/store/api/productsApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { showToast } from '@/store/slices/uiSlice';
import {
  clearDraft,
  saveDraft,
  selectCurrentStep,
  setCurrentStep,
  setSubmitted,
  WIZARD_TOTAL_STEPS,
} from '@/store/slices/wizardSlice';
import type { ProductDraft } from '@/types/product';
import { cn } from '@/utils/cn';
import { clearPersistedDraft, loadDraft, persistDraft } from '@/utils/draftStorage';
import { createEmptyDraft, draftToCreateInput, cloneDraft } from '@/utils/productDraft';
import { Step1Basic } from './Step1Basic';
import { Step2PricingVariations } from './Step2PricingVariations';
import { Step3Shipping } from './Step3Shipping';
import { Step4Review } from './Step4Review';

const STEP_TITLES = ['Basic info', 'Pricing & variations', 'Shipping', 'Review'] as const;

const STEP_FIELDS: ReadonlyArray<ReadonlyArray<Path<ProductFormValues>>> = [
  ['title', 'description', 'category', 'brand'],
  ['basePrice', 'discountPercentage', 'stock', 'variations'],
  ['weight', 'dimensions', 'fragile', 'hazardousDisclaimer', 'specialShippingNotes'],
  [],
];

const DRAFT_SAVE_DEBOUNCE_MS = 500;

export function WizardShell() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentStep = useAppSelector(selectCurrentStep);
  const [addProduct] = useAddProductMutation();
  const [pendingDraft, setPendingDraft] = useState<ProductDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSavedSnapshot = useRef('');

  const form = useForm<ProductFormValues>({
    resolver: yupResolver(productDraftSchema),
    defaultValues: createEmptyDraft(),
    mode: 'onTouched',
    shouldUnregister: false,
  });

  useEffect(() => {
    const stored = loadDraft();
    if (stored) setPendingDraft(stored);
  }, []);

  // Draft snapshots are debounced so keystrokes never reach the store directly,
  // and are skipped when nothing changed since the previous snapshot.
  useEffect(() => {
    let timer: number | undefined;
    const subscription = form.watch(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const draft = cloneDraft(form.getValues());
        const snapshot = JSON.stringify(draft);
        if (snapshot === lastSavedSnapshot.current) return;
        lastSavedSnapshot.current = snapshot;
        dispatch(saveDraft(draft));
        persistDraft(draft);
      }, DRAFT_SAVE_DEBOUNCE_MS);
    });

    return () => {
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [dispatch, form]);

  const resumeDraft = () => {
    if (!pendingDraft) return;
    form.reset(pendingDraft);
    lastSavedSnapshot.current = JSON.stringify(pendingDraft);
    dispatch(saveDraft(pendingDraft));
    setPendingDraft(null);
  };

  const discardDraft = () => {
    clearPersistedDraft();
    lastSavedSnapshot.current = '';
    dispatch(clearDraft());
    setPendingDraft(null);
  };

  const goNext = async () => {
    const fields = STEP_FIELDS[currentStep] ?? [];
    if (fields.length > 0) {
      const valid = await form.trigger([...fields]);
      if (!valid) return;
    }
    dispatch(setCurrentStep(Math.min(currentStep + 1, WIZARD_TOTAL_STEPS - 1)));
  };

  const goBack = () => dispatch(setCurrentStep(Math.max(currentStep - 1, 0)));

  const onSubmit = form.handleSubmit(async (values) => {
    // Submits can fire from an earlier step (Enter key, or the click that
    // advanced here) and those must never create the product.
    if (currentStep !== WIZARD_TOTAL_STEPS - 1) return;

    setIsSubmitting(true);
    const input = draftToCreateInput(values);

    try {
      await addProduct(input).unwrap();
      clearPersistedDraft();
      dispatch(clearDraft());
      dispatch(setSubmitted(true));
      dispatch(showToast({ type: 'success', message: 'Product created.' }));
      router.push('/products');
    } catch {
      dispatch(
        showToast({
          type: 'error',
          message: 'Could not create the product. Your draft is saved.',
          retry: { kind: 'create', data: input },
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">New product</h1>
        <p className="text-sm text-slate-600">
          Four steps, validated with Yup. Your draft is saved as you type.
        </p>
      </header>

      <ol className="mt-6 grid gap-2 sm:grid-cols-4">
        {STEP_TITLES.map((title, index) => {
          const state =
            index === currentStep ? 'current' : index < currentStep ? 'complete' : 'upcoming';

          return (
            <li key={title}>
              <button
                type="button"
                disabled={index >= currentStep}
                aria-current={state === 'current' ? 'step' : undefined}
                onClick={() => dispatch(setCurrentStep(index))}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition',
                  state === 'current' && 'border-slate-900 bg-slate-900 text-white',
                  state === 'complete' &&
                    'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  state === 'upcoming' && 'border-dashed border-slate-200 text-slate-400',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]',
                    state === 'current' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {index + 1}
                </span>
                {title}
              </button>
            </li>
          );
        })}
      </ol>

      <FormProvider {...form}>
        <form className="mt-6" onSubmit={onSubmit} noValidate>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {currentStep === 0 ? <Step1Basic /> : null}
            {currentStep === 1 ? <Step2PricingVariations /> : null}
            {currentStep === 2 ? <Step3Shipping /> : null}
            {currentStep === 3 ? (
              <Step4Review onEditStep={(step) => dispatch(setCurrentStep(step))} />
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={goBack} disabled={currentStep === 0}>
              Back
            </Button>
            {currentStep < WIZARD_TOTAL_STEPS - 1 ? (
              <Button
                key="next"
                onClick={() => {
                  void goNext();
                }}
              >
                Next
              </Button>
            ) : (
              <Button key="submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create product'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>

      <Modal
        open={pendingDraft !== null}
        title="Resume saved draft?"
        onClose={discardDraft}
        footer={
          <>
            <Button variant="secondary" onClick={discardDraft}>
              Start fresh
            </Button>
            <Button onClick={resumeDraft}>Resume draft</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          We found an unsaved product draft from your last visit
          {pendingDraft?.title ? (
            <>
              {' '}
              — <span className="font-medium text-slate-900">{pendingDraft.title}</span>
            </>
          ) : null}
          . Resume it, or start with a clean form.
        </p>
      </Modal>
    </div>
  );
}
