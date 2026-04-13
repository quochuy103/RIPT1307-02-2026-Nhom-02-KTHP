import { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { mockProducts, AdminProduct } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

const emptyProduct: Omit<AdminProduct, 'id'> = { name: '', price: 0, image: '/placeholder.svg', description: '', stock: 0, category: '' };

const AdminProducts = () => {
  const [products, setProducts] = useState(mockProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    const load = async () => {
      try {
        setProducts(await api.admin.getProducts());
      } catch {
        // keep fallback
      }
    };
    void load();
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyProduct); setModalOpen(true); };
  const openEdit = (p: AdminProduct) => { setEditing(p); setForm(p); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      if (editing) {
        await api.admin.updateProduct(editing.id, form);
        setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...form } : p));
        toast.success('Product updated');
      } else {
        await api.admin.createProduct(form);
        setProducts(await api.admin.getProducts());
        toast.success('Product created');
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.admin.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const columns: Column<AdminProduct>[] = [
    { key: 'image', label: 'Image', searchable: false, render: (p) => (
      <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-secondary" />
    )},
    { key: 'name', label: 'Name', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', render: (p) => `$${p.price}` },
    { key: 'stock', label: 'Stock', render: (p) => (
      <Badge variant={p.stock > 20 ? 'default' : p.stock > 0 ? 'outline' : 'destructive'}>
        {p.stock}
      </Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
          <p className="text-sm text-muted-foreground">{products.length} products</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Product</Button>
      </div>

      <DataTable data={products} columns={columns} searchPlaceholder="Search products..." actions={(p) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteProduct(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminProducts;
