import barber1 from '@/assets/barber-1.jpg';
import barber2 from '@/assets/barber-2.jpg';
import barber3 from '@/assets/barber-3.jpg';

export interface Service {
  id: string;
  nameKey: string;
  descKey: string;
  price: number;
  duration: number;
  category: 'haircut' | 'styling' | 'coloring' | 'grooming';
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  image: string;
  experience: number;
  specialties: string[];
  rating: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  category: string;
  description: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  commentKey: string;
  date: string;
  avatar: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: 'fade' | 'classic' | 'modern' | 'color';
}

export const services: Service[] = [
  { id: '1', nameKey: 'classicHaircut', descKey: 'classicHaircutDesc', price: 35, duration: 30, category: 'haircut' },
  { id: '2', nameKey: 'skinFade', descKey: 'skinFadeDesc', price: 40, duration: 45, category: 'haircut' },
  { id: '3', nameKey: 'buzzCut', descKey: 'buzzCutDesc', price: 25, duration: 20, category: 'haircut' },
  { id: '4', nameKey: 'beardTrim', descKey: 'beardTrimDesc', price: 20, duration: 20, category: 'grooming' },
  { id: '5', nameKey: 'hotTowelShave', descKey: 'hotTowelShaveDesc', price: 30, duration: 30, category: 'grooming' },
  { id: '6', nameKey: 'hairColoring', descKey: 'hairColoringDesc', price: 60, duration: 60, category: 'coloring' },
  { id: '7', nameKey: 'highlights', descKey: 'highlightsDesc', price: 75, duration: 90, category: 'coloring' },
  { id: '8', nameKey: 'hairStyling', descKey: 'hairStylingDesc', price: 30, duration: 25, category: 'styling' },
  { id: '9', nameKey: 'pompadourStyle', descKey: 'pompadourStyleDesc', price: 45, duration: 40, category: 'styling' },
  { id: '10', nameKey: 'kidsHaircut', descKey: 'kidsHaircutDesc', price: 25, duration: 25, category: 'haircut' },
];

export const barbers: Barber[] = [
  { id: '1', name: 'Marcus Cole', role: 'Master Barber', image: barber1, experience: 12, specialties: ['Fades', 'Classic Cuts'], rating: 4.9 },
  { id: '2', name: 'Jake Rivera', role: 'Senior Barber', image: barber2, experience: 8, specialties: ['Beard Design', 'Hot Shaves'], rating: 4.8 },
  { id: '3', name: 'Sofia Chen', role: 'Color Specialist', image: barber3, experience: 10, specialties: ['Coloring', 'Modern Styles'], rating: 4.9 },
];

export const products: Product[] = [
  { id: '1', name: 'Premium Hair Wax', price: 24.99, image: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400', rating: 4.7, category: 'Styling', description: 'Strong hold matte finish wax' },
  { id: '2', name: 'Styling Gel', price: 18.99, image: 'https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?w=400', rating: 4.5, category: 'Styling', description: 'Medium hold wet look gel' },
  { id: '3', name: 'Hair Spray', price: 16.99, image: 'https://images.unsplash.com/photo-1597854710218-d2965630e4aa?w=400', rating: 4.3, category: 'Finishing', description: 'Long-lasting flexible hold spray' },
  { id: '4', name: 'Beard Oil', price: 22.99, image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400', rating: 4.8, category: 'Beard Care', description: 'Nourishing beard oil with argan' },
  { id: '5', name: 'Pomade', price: 21.99, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', rating: 4.6, category: 'Styling', description: 'Classic pomade for slick styles' },
  { id: '6', name: 'Shampoo', price: 14.99, image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400', rating: 4.4, category: 'Hair Care', description: 'Sulfate-free daily shampoo' },
];

export const reviews: Review[] = [
  { id: '1', name: 'David M.', rating: 5, commentKey: 'r1', date: '2024-03-15', avatar: 'DM' },
  { id: '2', name: 'Chris P.', rating: 5, commentKey: 'r2', date: '2024-03-10', avatar: 'CP' },
  { id: '3', name: 'Alex T.', rating: 4, commentKey: 'r3', date: '2024-02-28', avatar: 'AT' },
  { id: '4', name: 'Ryan K.', rating: 5, commentKey: 'r4', date: '2024-02-20', avatar: 'RK' },
  { id: '5', name: 'James L.', rating: 5, commentKey: 'r5', date: '2024-02-15', avatar: 'JL' },
];

export const galleryImages: GalleryImage[] = [
  { id: '1', src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600', alt: 'Classic fade haircut', category: 'fade' },
  { id: '2', src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600', alt: 'Modern textured crop', category: 'modern' },
  { id: '3', src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600', alt: 'Classic pompadour', category: 'classic' },
  { id: '4', src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600', alt: 'Platinum blonde color', category: 'color' },
  { id: '5', src: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600', alt: 'Low skin fade', category: 'fade' },
  { id: '6', src: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=600', alt: 'Slicked back modern', category: 'modern' },
  { id: '7', src: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=600', alt: 'Gentleman cut', category: 'classic' },
  { id: '8', src: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600', alt: 'Highlight coloring', category: 'color' },
];

export const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];
