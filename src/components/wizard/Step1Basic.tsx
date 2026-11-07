'use client';

import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import type { ProductFormValues } from '@/schemas/productSchemas';
import { useGetCategoriesQuery } from '@/store/api/productsApi';
import { useFormContext, useWatch } from 'react-hook-form';

export function Step1Basic() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProductFormValues>();
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();
  const selectedCategory = useWatch({ control, name: 'category' });
  const hasSelectedCategoryOption = categories.some(
    (category) => category.slug === selectedCategory,
  );

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title" htmlFor="product-title" error={errors.title?.message}>
        <Input
          id="product-title"
          placeholder="Wireless noise-cancelling headphones"
          {...register('title')}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="product-description"
        hint="At least 10 characters."
        error={errors.description?.message}
      >
        <Textarea
          id="product-description"
          rows={4}
          placeholder="What makes this product worth stocking?"
          {...register('description')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Category"
          htmlFor="product-category"
          error={errors.category?.message}
          hint={
            isError
              ? 'Could not load categories. Check your connection and refresh.'
              : undefined
          }
        >
          <Select id="product-category" disabled={isLoading} {...register('category')}>
            <option value="">{isLoading ? 'Loading categories…' : 'Select a category'}</option>
            {selectedCategory && !hasSelectedCategoryOption ? (
              <option value={selectedCategory}>{selectedCategory}</option>
            ) : null}
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Brand (optional)" htmlFor="product-brand" error={errors.brand?.message}>
          <Input id="product-brand" placeholder="Acme" {...register('brand')} />
        </Field>
      </div>
    </div>
  );
}
