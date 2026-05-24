import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Mail, MapPin, Phone, RefreshCw, Save, Shield, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ApiError, api, type UserProfile } from '@/lib/api';
import { uploadImage } from '@/services/uploadService';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type ProfileForm = {
  fullName: string;
  phone: string;
  gender: string;
  address: string;
};

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value.split(/[T ]/)[0] || value;
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
};

const getProfileError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Please sign in again to view your profile.';
    if (error.status === 403) return 'You do not have permission to manage this profile.';
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

const toForm = (profile: UserProfile): ProfileForm => ({
  fullName: profile.fullName || profile.name || '',
  phone: profile.phone || '',
  gender: profile.gender || '',
  address: profile.address || '',
});

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, syncUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => (
    user
      ? {
        id: user.id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }
      : null
  ));
  const [form, setForm] = useState<ProfileForm>(() => (profile ? toForm(profile) : { fullName: '', phone: '', gender: '', address: '' }));
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const syncAuthUser = useCallback((nextProfile: UserProfile) => {
    if (!nextProfile.email) return;

    const normalizedRole = nextProfile.role === 'admin' ? 'admin' : 'user';
    syncUser({
      id: nextProfile.id,
      name: nextProfile.fullName || nextProfile.name || user?.name || '',
      email: nextProfile.email,
      role: normalizedRole,
      avatarUrl: nextProfile.avatarUrl ?? null,
    });
  }, [syncUser, user?.name]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const nextProfile = await api.user.getMe();
      setProfile(nextProfile);
      setForm(toForm(nextProfile));
      syncAuthUser(nextProfile);
    } catch (err) {
      setError(getProfileError(err, t('profile.errors.load')));
    } finally {
      setIsLoading(false);
    }
  }, [syncAuthUser, t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const provider = useMemo(() => profile?.provider || profile?.accountProvider || '', [profile]);
  const displayName = profile?.fullName || profile?.name || user?.name || t('profile.unknown');
  const avatarUrl = avatarPreview || profile?.avatarUrl || user?.avatarUrl || undefined;

  const handleSave = async () => {
    const fullName = form.fullName.trim();
    if (!fullName) {
      toast.error(t('profile.errors.nameRequired'));
      return;
    }

    try {
      setIsSaving(true);
      const nextProfile = await api.user.updateProfile({
        fullName,
        phone: form.phone.trim() || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
      });
      setProfile(nextProfile);
      setForm(toForm(nextProfile));
      syncAuthUser(nextProfile);
      setIsEditing(false);
      toast.success(t('profile.saveSuccess'));
    } catch (err) {
      toast.error(getProfileError(err, t('profile.errors.save')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error(t('profile.errors.avatarType'));
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(t('profile.errors.avatarSize'));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      setIsUploading(true);
      await uploadImage({ file, context: 'AVATAR' });
      const nextProfile = await api.user.getMe();
      setProfile(nextProfile);
      setForm(toForm(nextProfile));
      syncAuthUser(nextProfile);
      setAvatarPreview(null);
      toast.success(t('profile.avatarSuccess'));
    } catch (err) {
      setAvatarPreview(null);
      toast.error(getProfileError(err, t('profile.errors.avatar')));
    } finally {
      setIsUploading(false);
    }
  };

  const cancelEdit = () => {
    if (profile) setForm(toForm(profile));
    setIsEditing(false);
  };

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            {t('profile.title')} <span className="text-gradient-gold">{t('profile.highlight')}</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t('profile.subtitle')}</p>
        </div>

        {isLoading && !profile ? (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="h-80 rounded-lg border border-border bg-card animate-pulse" />
            <div className="h-96 rounded-lg border border-border bg-card animate-pulse" />
          </div>
        ) : error && !profile ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={() => void loadProfile()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : !profile ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t('profile.empty')}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-28 w-28 border border-border">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="text-2xl">{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={t('profile.changeAvatar')}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleAvatarFile(file);
                        event.target.value = '';
                      }}
                    />
                  </div>

                  <h2 className="mt-5 font-display text-2xl font-semibold">{displayName}</h2>
                  {profile.email && <p className="mt-1 text-sm text-muted-foreground break-all">{profile.email}</p>}
                  {profile.role && (
                    <Badge className="mt-4 capitalize" variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role}
                    </Badge>
                  )}
                  <p className="mt-4 text-xs text-muted-foreground">{t('profile.avatarHint')}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>{t('profile.errors.refreshTitle')}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">{t('profile.personalInfo')}</CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
                          <X className="mr-2 h-4 w-4" />
                          {t('profile.cancel')}
                        </Button>
                        <Button onClick={() => void handleSave()} disabled={isSaving}>
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          {isSaving ? t('common.saving') : t('profile.save')}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>{t('profile.edit')}</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t('profile.fields.fullName')}</Label>
                      <Input
                        id="fullName"
                        value={form.fullName}
                        disabled={!isEditing || isSaving}
                        onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('profile.fields.phone')}</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        disabled={!isEditing || isSaving}
                        placeholder={t('profile.placeholders.phone')}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.fields.gender')}</Label>
                      <Select
                        value={form.gender || 'none'}
                        disabled={!isEditing || isSaving}
                        onValueChange={(value) => setForm((current) => ({ ...current, gender: value === 'none' ? '' : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('profile.notProvided')}</SelectItem>
                          <SelectItem value="male">{t('profile.gender.male')}</SelectItem>
                          <SelectItem value="female">{t('profile.gender.female')}</SelectItem>
                          <SelectItem value="other">{t('profile.gender.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.fields.createdAt')}</Label>
                      <Input value={formatDate(profile.createdAt)} disabled readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t('profile.fields.address')}</Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      disabled={!isEditing || isSaving}
                      placeholder={t('profile.placeholders.address')}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">{t('profile.accountInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <dt className="text-xs font-medium uppercase text-muted-foreground">{t('profile.fields.email')}</dt>
                        <dd className="mt-1 break-all text-sm">{profile.email || t('profile.notProvided')}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <dt className="text-xs font-medium uppercase text-muted-foreground">{t('profile.fields.role')}</dt>
                        <dd className="mt-1 text-sm capitalize">{profile.role || t('profile.notProvided')}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <UserRound className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <dt className="text-xs font-medium uppercase text-muted-foreground">{t('profile.fields.provider')}</dt>
                        <dd className="mt-1 text-sm capitalize">{provider || t('profile.notProvided')}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <dt className="text-xs font-medium uppercase text-muted-foreground">{t('profile.fields.phone')}</dt>
                        <dd className="mt-1 text-sm">{profile.phone || t('profile.notProvided')}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <dt className="text-xs font-medium uppercase text-muted-foreground">{t('profile.fields.address')}</dt>
                        <dd className="mt-1 text-sm">{profile.address || t('profile.notProvided')}</dd>
                      </div>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
