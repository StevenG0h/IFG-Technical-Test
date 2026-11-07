'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { editProductSchema, type EditProductFormValues } from '@/schemas/productSchemas';
import { useUpdateProductMutation } from '@/store/api/productsApi';
import type { Product } from '@/types/product';

export interface EditProductModalProps {
  product: Product;
  onClose: () => void;
}

/**
 * Mounted per product (keyed by id) so the initial field values come straight
 * from props instead of a state-syncing effect. Validation reuses the Yup rules
 * from the product schemas, and the modal only closes once the write succeeds.
 */
export function EditProductModal({ product, onClose }: EditProductModalProps) {
  const [updateProduct] = useUpdateProductMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProductFormValues>({
    resolver: yupResolver(editProductSchema),
    defaultValues: { price: product.price, stock: product.stock },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProduct({ id: product.id, data: values }).unwrap();
      onClose();
    } catch {
      // onQueryStarted already reverted the optimistic cache patch and raised a
      // retry toast. Stay open so the values can be corrected and resubmitted.
    }
  });

  return (
    <Modal open title="Edit product" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <p className="text-sm text-slate-600">
          Updating <span className="font-medium text-slate-900">{product.title}</span> applies
          optimistically and rolls back if the request fails.
        </p>
        <Field label="Price" htmlFor="edit-price" error={errors.price?.message}>
          <Input
            id="edit-price"
            type="number"
            min="0"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Stock" htmlFor="edit-stock" error={errors.stock?.message}>
          <Input
            id="edit-stock"
            type="number"
            min="0"
            step="1"
            {...register('stock', { valueAsNumber: true })}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
