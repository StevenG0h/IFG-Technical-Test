import * as yup from 'yup';

export const SKU_REGEX = /^SKU-[A-Z]{3}-\d{4}$/;

const positiveNumber = (label: string) =>
  yup
    .number()
    .typeError(`${label} must be a number`)
    .positive(`${label} must be greater than 0`)
    .required(`${label} is required`);

export const variationSchema = yup.object({
  color: yup.string().trim().required('Colour is required'),
  size: yup.string().trim().required('Size is required'),
  skuCode: yup
    .string()
    .trim()
    .required('SKU code is required')
    .matches(SKU_REGEX, 'Use the format SKU-ABC-1234'),
  extraPrice: yup
    .number()
    .typeError('Extra price must be a number')
    .min(0, 'Extra price cannot be negative')
    .required('Extra price is required'),
});

export const productDraftSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters'),
  description: yup
    .string()
    .trim()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  category: yup.string().trim().required('Category is required'),
  brand: yup.string().trim().default(''),
  basePrice: positiveNumber('Base price'),
  discountPercentage: yup
    .number()
    .typeError('Discount must be a number')
    .min(0, 'Discount cannot be negative')
    .max(99, 'Discount cannot exceed 99')
    .required('Discount is required'),
  stock: yup
    .number()
    .typeError('Stock must be a number')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .required('Stock is required'),
  variations: yup
    .array()
    .of(variationSchema)
    .default([])
    .test('unique-sku', 'Duplicate SKU codes are not allowed', (variations) => {
      const codes = (variations ?? [])
        .map((variation) => variation?.skuCode)
        .filter((code): code is string => typeof code === 'string' && code !== '');
      return new Set(codes).size === codes.length;
    }),
  weight: positiveNumber('Weight'),
  dimensions: yup
    .object({
      width: positiveNumber('Width'),
      height: positiveNumber('Height'),
      depth: positiveNumber('Depth'),
    })
    .required(),
  fragile: yup.boolean().default(false),
  hazardousDisclaimer: yup
    .boolean()
    .default(false)
    .when('fragile', {
      is: true,
      then: (schema) => schema.oneOf([true], 'You must accept the disclaimer'),
      otherwise: (schema) => schema,
    }),
  specialShippingNotes: yup.string().when('fragile', {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .min(10, 'Shipping notes must be at least 10 characters')
        .required('Shipping notes are required for fragile items'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export type ProductFormValues = yup.InferType<typeof productDraftSchema>;

/**
 * Edit-in-place form for the directory modal. Shares the numeric rules with the
 * draft schema instead of duplicating them in the component.
 */
export const editProductSchema = yup.object({
  price: positiveNumber('Price'),
  stock: yup
    .number()
    .typeError('Stock must be a number')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .required('Stock is required'),
});

export type EditProductFormValues = yup.InferType<typeof editProductSchema>;

export const step1Schema = productDraftSchema.pick([
  'title',
  'description',
  'category',
  'brand',
]);

export const step2Schema = productDraftSchema.pick([
  'basePrice',
  'discountPercentage',
  'stock',
  'variations',
]);

export const step3Schema = productDraftSchema.pick([
  'weight',
  'dimensions',
  'fragile',
  'hazardousDisclaimer',
  'specialShippingNotes',
]);
