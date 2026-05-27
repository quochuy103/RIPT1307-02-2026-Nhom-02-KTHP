import type { TFunction } from 'i18next';
import type { Service } from '@/data/mockData';

export interface ServiceI18nMeta {
  slug: string;
  nameKey: string;
  descKey: string;
}

const serviceI18nByName: Record<string, ServiceI18nMeta> = {
  'Cắt Tóc Học Sinh': { slug: 'cat-toc-hoc-sinh', nameKey: 'studentHaircut', descKey: 'studentHaircutDesc' },
  'Cắt Tóc Sinh Viên & Người Lớn': { slug: 'cat-toc-sinh-vien-nguoi-lon', nameKey: 'adultHaircut', descKey: 'adultHaircutDesc' },
  'Cắt Kéo Chuyên Sâu': { slug: 'cat-keo-chuyen-sau', nameKey: 'scissorCut', descKey: 'scissorCutDesc' },
  'Gội Sau Khi Cắt': { slug: 'goi-sau-khi-cat', nameKey: 'postCutWash', descKey: 'postCutWashDesc' },
  'Combo Wow Handsome': { slug: 'combo-wow-handsome', nameKey: 'wowHandsomeCombo', descKey: 'wowHandsomeComboDesc' },
  'Uốn Thường': { slug: 'uon-thuong', nameKey: 'basicPerm', descKey: 'basicPermDesc' },
  'Uốn Ruffled': { slug: 'uon-ruffled', nameKey: 'ruffledPerm', descKey: 'ruffledPermDesc' },
  'Ép Side Tóc': { slug: 'ep-side-toc', nameKey: 'sideHairPress', descKey: 'sideHairPressDesc' },
  'Nhuộm Thường': { slug: 'nhuom-thuong', nameKey: 'basicColoring', descKey: 'basicColoringDesc' },
  'Tẩy Tóc (1 lần)': { slug: 'tay-toc-1-lan', nameKey: 'hairBleachOnce', descKey: 'hairBleachOnceDesc' },
  'Gội Đầu Siêu Thư Giãn': { slug: 'goi-dau-sieu-thu-gian', nameKey: 'relaxingShampoo', descKey: 'relaxingShampooDesc' },
  'Gội Đầu Dưỡng Sinh': { slug: 'goi-dau-duong-sinh', nameKey: 'wellnessShampoo', descKey: 'wellnessShampooDesc' },
  'Tẩy Tế Bào Chết Da Mặt': { slug: 'tay-te-bao-chet-da-mat', nameKey: 'faceExfoliation', descKey: 'faceExfoliationDesc' },
  'Đắp Mặt Nạ Dưỡng Da': { slug: 'dap-mat-na-duong-da', nameKey: 'facialMask', descKey: 'facialMaskDesc' },
  'Tẩy Tế Bào Chết Da Đầu': { slug: 'tay-te-bao-chet-da-dau', nameKey: 'scalpExfoliation', descKey: 'scalpExfoliationDesc' },
  'Combo Đẹp Tryyy (Lại còn dài)': { slug: 'combo-dep-tryyy-lai-con-dai', nameKey: 'depTryyyCombo', descKey: 'depTryyyComboDesc' },
};

const serviceI18nBySlug = Object.values(serviceI18nByName).reduce<Record<string, ServiceI18nMeta>>((acc, meta) => {
  acc[meta.slug] = meta;
  return acc;
}, {});

export const getServiceI18nMeta = (service: Pick<Service, 'slug' | 'name' | 'nameKey' | 'descKey'> | string): ServiceI18nMeta | undefined => {
  if (typeof service === 'string') {
    return serviceI18nByName[service] ?? serviceI18nBySlug[service];
  }

  if (service.nameKey && service.descKey) {
    return {
      slug: service.slug ?? service.nameKey,
      nameKey: service.nameKey,
      descKey: service.descKey,
    };
  }

  return (service.slug ? serviceI18nBySlug[service.slug] : undefined) ?? (service.name ? serviceI18nByName[service.name] : undefined);
};

export const getServiceDisplayName = (service: Service, t: TFunction) => {
  const meta = getServiceI18nMeta(service);
  return meta ? t(`serviceItems.${meta.nameKey}`) : service.name || t(`serviceItems.${service.nameKey}`);
};

export const getServiceDescription = (service: Service, t: TFunction) => {
  const meta = getServiceI18nMeta(service);
  return meta ? t(`serviceItems.${meta.descKey}`) : service.description || t(`serviceItems.${service.descKey}`);
};

export const getServiceCategoryLabel = (service: Service, t: TFunction) => (
  t(`services.categories.${service.category}`, {
    defaultValue: service.categoryLabel ?? service.category,
  })
);
