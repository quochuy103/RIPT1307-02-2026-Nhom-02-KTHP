import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  submitLabel?: string;
  children: React.ReactNode;
}

const FormModal = ({ open, onClose, title, onSubmit, submitLabel, children }: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {children}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('admin.modal.cancel')}</Button>
          <Button onClick={onSubmit}>{submitLabel ?? t('admin.modal.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormModal;
