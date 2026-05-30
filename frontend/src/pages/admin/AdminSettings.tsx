import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AdminSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleProfileUpdate = () => {
    toast.success(t('admin.settingsPage.profileUpdated'));
  };

  const handlePasswordChange = () => {
    if (!currentPass || !newPass) { toast.error(t('admin.common.fillAll')); return; }
    if (newPass !== confirmPass) { toast.error(t('admin.common.passwordMismatch')); return; }
    if (newPass.length < 6) { toast.error(t('admin.common.passwordLength')); return; }
    toast.success(t('admin.settingsPage.passwordChanged'));
    setCurrentPass(''); setNewPass(''); setConfirmPass('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.settingsPage.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.settingsPage.subtitle')}</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">{t('admin.settingsPage.profileInfo')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>{t('admin.fields.name')}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>{t('admin.fields.email')}</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button onClick={handleProfileUpdate}>{t('admin.settingsPage.saveChanges')}</Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">{t('admin.settingsPage.changePassword')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>{t('admin.fields.currentPassword')}</Label><Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} /></div>
          <div><Label>{t('admin.fields.newPassword')}</Label><Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} /></div>
          <div><Label>{t('admin.fields.confirmPassword')}</Label><Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} /></div>
          <Button onClick={handlePasswordChange}>{t('admin.settingsPage.changePassword')}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
