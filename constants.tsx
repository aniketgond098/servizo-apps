
import { Specialist } from './types';

export const SPECIALISTS: Specialist[] = [
  {
    id: 'rajesh-kumar',
    name: 'Rajesh Kumar',
    title: 'Principal Architect',
    // Added missing category, lat, and lng properties
    category: 'Architecture',
    lat: 19.0760,
    lng: 72.8777,
    description: 'Master Systems Architect specializing in next-generation industrial infrastructure and high-luxury automation ecosystems.',
    tags: ['Sustainable', 'Luxe Minimalist', 'Vastu Expert'],
    hourlyRate: 2500,
    rating: 4.98,
    experience: 12,
    projects: 2400,
    location: 'Mumbai, IN',
    avatar: 'https://picsum.photos/seed/rajesh/400/400',
    // Fixed: Removed 'featured' property as it is not in the Specialist type
    skills: ['Smart Home Automation', 'Industrial IoT', 'Solar Infrastructure', 'HVAC Optimization'],
    credentials: ['IIT Bombay Alumnus', 'A-1 Licensed Electrical Engineer']
  },
  {
    id: 'amit-sharma',
    name: 'Amit Sharma',
    title: 'Neo-Classical Specialist',
    // Added missing category, lat, and lng properties
    category: 'Aesthetics',
    lat: 19.0544,
    lng: 72.8402,
    description: 'Specializing in acoustic engineering and custom lighting design for premium residences.',
    tags: ['Acoustics', 'Lighting'],
    hourlyRate: 1800,
    rating: 4.85,
    experience: 8,
    projects: 1200,
    location: 'Mumbai, IN',
    avatar: 'https://picsum.photos/seed/amit/400/400',
    skills: ['Acoustic Engineering', 'Custom Lighting'],
    credentials: ['Design Council Certified']
  },
  {
    id: 'suresh-raina',
    name: 'Suresh Raina',
    title: 'Smart Home Integrator',
    // Added missing category, lat, and lng properties
    category: 'Automation',
    lat: 12.9716,
    lng: 77.5946,
    description: 'Home IoT ecosystem expert with focus on security and privacy automation.',
    tags: ['IoT', 'Automation'],
    hourlyRate: 2100,
    rating: 4.92,
    experience: 10,
    projects: 1800,
    location: 'Bangalore, IN',
    avatar: 'https://picsum.photos/seed/suresh/400/400',
    skills: ['IoT Ecosystems', 'Privacy Automation'],
    credentials: ['SmartHub Gold Member']
  },
  {
    id: 'ananya-iyer',
    name: 'Ananya Iyer',
    title: 'Biophilic Designer',
    // Added missing category, lat, and lng properties
    category: 'Architecture',
    lat: 13.0827,
    lng: 80.2707,
    description: 'Organic vertical gardens and sustainable material expert for ultra-premium standards.',
    tags: ['Organic', 'Sustainable'],
    hourlyRate: 2300,
    rating: 4.95,
    experience: 7,
    projects: 950,
    location: 'Chennai, IN',
    avatar: 'https://picsum.photos/seed/ananya/400/400',
    skills: ['Vertical Gardens', 'Sustainable Materials'],
    credentials: ['LEED Platinum Certified']
  }
];
