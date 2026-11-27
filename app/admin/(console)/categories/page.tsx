// app/admin/categories/page.tsx

import { getAdminCategories } from '@/lib/admin/queries';
import { CategoriesClient } from '@/components/admin/CategoriesClient';

export const metadata = {
  title: 'HiddenGems Nepal | Categories',
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return <CategoriesClient initialCategories={categories} />;
}
