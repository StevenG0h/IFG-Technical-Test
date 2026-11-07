import type { Metadata } from 'next';
import { WizardShell } from '@/components/wizard/WizardShell';

export const metadata: Metadata = {
  title: 'New product · Inventory Portal',
  description: 'Create a product with the four step validation wizard.',
};

export default function NewProductPage() {
  return <WizardShell />;
}
