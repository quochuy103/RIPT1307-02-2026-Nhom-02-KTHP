import { useState } from 'react';
import { services, products } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, CalendarDays, Package, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const mockBookings = [
  { id: '1', client: 'John Doe', serviceKey: 'skinFade', barber: 'Marcus Cole', date: '2024-04-01', time: '10:00 AM', status: 'confirmed' },
  { id: '2', client: 'Mike Smith', serviceKey: 'beardTrim', barber: 'Jake Rivera', date: '2024-04-01', time: '11:30 AM', status: 'pending' },
  { id: '3', client: 'Alex Johnson', serviceKey: 'hairColoring', barber: 'Sofia Chen', date: '2024-04-02', time: '2:00 PM', status: 'confirmed' },
];

const AdminPage = () => {
  const [tab, setTab] = useState('bookings');
  const { t } = useTranslation();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-4xl font-bold mb-1">{t('admin.title')} <span className="text-gradient-gold">{t('admin.highlight')}</span></h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarDays className="h-4 w-4 mr-2" /> {t('admin.bookings')}
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Scissors className="h-4 w-4 mr-2" /> {t('admin.services')}
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-4 w-4 mr-2" /> {t('admin.products')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>{t('admin.client')}</TableHead><TableHead>{t('admin.service')}</TableHead><TableHead>{t('admin.barber')}</TableHead><TableHead>{t('admin.date')}</TableHead><TableHead>{t('admin.time')}</TableHead><TableHead>{t('admin.status')}</TableHead><TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBookings.map(b => (
                    <TableRow key={b.id} className="border-border">
                      <TableCell className="font-medium">{b.client}</TableCell>
                      <TableCell>{t(`serviceItems.${b.serviceKey}`)}</TableCell>
                      <TableCell>{b.barber}</TableCell>
                      <TableCell>{b.date}</TableCell>
                      <TableCell>{b.time}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{t(`admin.${b.status}`)}</span></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => toast.info(t('admin.editBooking'))}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toast.info(t('admin.deleteBooking'))} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="flex justify-end mb-4">
              <Button size="sm" className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> {t('admin.addService')}</Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>{t('admin.name')}</TableHead><TableHead>{t('admin.category')}</TableHead><TableHead>{t('admin.price')}</TableHead><TableHead>{t('admin.duration')}</TableHead><TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(s => (
                    <TableRow key={s.id} className="border-border">
                      <TableCell className="font-medium">{t(`serviceItems.${s.nameKey}`)}</TableCell>
                      <TableCell>{t(`services.categories.${s.category}`)}</TableCell>
                      <TableCell>${s.price}</TableCell>
                      <TableCell>{s.duration} {t('services.min')}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => toast.info(t('admin.editService'))}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="flex justify-end mb-4">
              <Button size="sm" className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> {t('admin.addProduct')}</Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>{t('admin.name')}</TableHead><TableHead>{t('admin.category')}</TableHead><TableHead>{t('admin.price')}</TableHead><TableHead>{t('admin.rating')}</TableHead><TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id} className="border-border">
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>${p.price}</TableCell>
                      <TableCell>{p.rating}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => toast.info(t('admin.editProduct'))}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
