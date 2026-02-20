import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Specialist, User } from '../types';

const NEW_WORKERS: { specialist: Specialist; user: User }[] = [
  // ── BORIVALI ──────────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'arjun-b', userId: 'WORKER-002', name: 'Arjun Bhatt',
      title: 'Senior Electrician', category: 'Electrical',
      description: 'Specialises in residential wiring, switchboard upgrades, and solar panel installation across Borivali.',
      tags: ['Solar', 'Wiring', 'Safety'], hourlyRate: 900, rating: 4.85, experience: 8, projects: 620,
      location: 'Borivali West, Mumbai', lat: 19.2307, lng: 72.8567,
      avatar: 'https://i.pravatar.cc/150?u=arjun-b',
      skills: ['Solar PV', 'DB Wiring', 'Safety Audit'], credentials: ['ITI Electrician', 'Solar Installer Cert'],
      availability: 'available', verified: true, backgroundChecked: true, fastResponder: true,
    },
    user: {
      id: 'WORKER-002', email: 'arjun.bhatt@servizo.in', password: 'Arjun@2024',
      name: 'Arjun Bhatt', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=arjun-b',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'sunita-p', userId: 'WORKER-003', name: 'Sunita Patil',
      title: 'Interior Designer & Aesthetics', category: 'Aesthetics',
      description: 'Creates stunning modern interiors for homes and offices in Borivali and surrounding areas.',
      tags: ['Modern', 'Budget-Friendly', 'Vastu'], hourlyRate: 1200, rating: 4.91, experience: 6, projects: 310,
      location: 'Borivali East, Mumbai', lat: 19.2280, lng: 72.8706,
      avatar: 'https://i.pravatar.cc/150?u=sunita-p',
      skills: ['Space Planning', 'Color Theory', '3D Rendering'], credentials: ['NIFT Mumbai', 'IGBC Green Interior'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true,
    },
    user: {
      id: 'WORKER-003', email: 'sunita.patil@servizo.in', password: 'Sunita@2024',
      name: 'Sunita Patil', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=sunita-p',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'vikram-d', userId: 'WORKER-004', name: 'Vikram Desai',
      title: 'Master Plumber', category: 'Plumbing',
      description: 'Expert in pipe leak detection, bathroom fittings, and water purifier installation in Borivali.',
      tags: ['Leak Fix', 'Sanitary', 'Quick'], hourlyRate: 750, rating: 4.78, experience: 10, projects: 880,
      location: 'Borivali West, Mumbai', lat: 19.2340, lng: 72.8540,
      avatar: 'https://i.pravatar.cc/150?u=vikram-d',
      skills: ['PVC Piping', 'Bathroom Fitting', 'RO Installation'], credentials: ['ITI Plumber', 'CPWD Licensed'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-004', email: 'vikram.desai@servizo.in', password: 'Vikram@2024',
      name: 'Vikram Desai', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=vikram-d',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'meena-j', userId: 'WORKER-005', name: 'Meena Joshi',
      title: 'Home Automation Specialist', category: 'Automation',
      description: 'Installs smart home systems including Alexa/Google Home integration in Borivali.',
      tags: ['Smart Home', 'IoT', 'Energy Saving'], hourlyRate: 1500, rating: 4.95, experience: 5, projects: 215,
      location: 'Borivali East, Mumbai', lat: 19.2260, lng: 72.8730,
      avatar: 'https://i.pravatar.cc/150?u=meena-j',
      skills: ['Smart Lighting', 'CCTV', 'Voice Automation'], credentials: ['Cisco IoT', 'Honeywell Certified'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true, fastResponder: true, insuranceVerified: true,
    },
    user: {
      id: 'WORKER-005', email: 'meena.joshi@servizo.in', password: 'Meena@2024',
      name: 'Meena Joshi', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=meena-j',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'rohit-m', userId: 'WORKER-006', name: 'Rohit Malhotra',
      title: 'Structural Architect', category: 'Architecture',
      description: 'Handles renovation designs, floor plans, and structural audits for buildings in Borivali.',
      tags: ['Renovation', 'Structural', 'Permits'], hourlyRate: 2000, rating: 4.88, experience: 11, projects: 430,
      location: 'Borivali West, Mumbai', lat: 19.2295, lng: 72.8580,
      avatar: 'https://i.pravatar.cc/150?u=rohit-m',
      skills: ['AutoCAD', 'Revit', 'Structural Analysis'], credentials: ['COA Registered', 'IIT Delhi Alumni'],
      availability: 'busy', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-006', email: 'rohit.malhotra@servizo.in', password: 'Rohit@2024',
      name: 'Rohit Malhotra', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=rohit-m',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── KANDIVALI ─────────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'kavita-r', userId: 'WORKER-007', name: 'Kavita Rao',
      title: 'Electrical Contractor', category: 'Electrical',
      description: 'Full home rewiring, MCB panel upgrades, and EV charger installation across Kandivali.',
      tags: ['EV Charger', 'Rewiring', 'Panel Upgrade'], hourlyRate: 950, rating: 4.82, experience: 7, projects: 540,
      location: 'Kandivali West, Mumbai', lat: 19.2084, lng: 72.8276,
      avatar: 'https://i.pravatar.cc/150?u=kavita-r',
      skills: ['HT/LT Wiring', 'EV Charging', 'Load Analysis'], credentials: ['ITI Electrical', 'MSEDCL Licensed'],
      availability: 'available', verified: true, backgroundChecked: true, fastResponder: true,
    },
    user: {
      id: 'WORKER-007', email: 'kavita.rao@servizo.in', password: 'Kavita@2024',
      name: 'Kavita Rao', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=kavita-r',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'deepak-s', userId: 'WORKER-008', name: 'Deepak Shah',
      title: 'Plumbing & Waterproofing Expert', category: 'Plumbing',
      description: 'Specialises in terrace waterproofing, sump pump repair, and complete bathroom overhauls in Kandivali.',
      tags: ['Waterproofing', 'Sump Pump', 'Bathroom'], hourlyRate: 800, rating: 4.76, experience: 9, projects: 710,
      location: 'Kandivali East, Mumbai', lat: 19.2050, lng: 72.8600,
      avatar: 'https://i.pravatar.cc/150?u=deepak-s',
      skills: ['Waterproofing', 'Pump Repair', 'Tile Grouting'], credentials: ['CPWD Approved', 'BWA Certified'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-008', email: 'deepak.shah@servizo.in', password: 'Deepak@2024',
      name: 'Deepak Shah', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=deepak-s',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'pooja-n', userId: 'WORKER-009', name: 'Pooja Nair',
      title: 'Interior Stylist', category: 'Aesthetics',
      description: 'Transform your living space with minimalist and Scandinavian design aesthetics — serving Kandivali.',
      tags: ['Minimalist', 'Scandinavian', 'Decor'], hourlyRate: 1100, rating: 4.93, experience: 4, projects: 175,
      location: 'Kandivali West, Mumbai', lat: 19.2060, lng: 72.8260,
      avatar: 'https://i.pravatar.cc/150?u=pooja-n',
      skills: ['Furniture Layout', 'Fabric Selection', 'Lighting Design'], credentials: ['Pearl Academy', 'IGBC Member'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true,
    },
    user: {
      id: 'WORKER-009', email: 'pooja.nair@servizo.in', password: 'Pooja@2024',
      name: 'Pooja Nair', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=pooja-n',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'amit-g', userId: 'WORKER-010', name: 'Amit Gupta',
      title: 'Automotive Mechanic', category: 'Mechanical',
      description: 'Multi-brand car service, AC repair, and engine diagnostics at your doorstep in Kandivali.',
      tags: ['Doorstep Service', 'AC Repair', 'Diagnostics'], hourlyRate: 850, rating: 4.80, experience: 12, projects: 1100,
      location: 'Kandivali East, Mumbai', lat: 19.2030, lng: 72.8620,
      avatar: 'https://i.pravatar.cc/150?u=amit-g',
      skills: ['Engine Diagnostics', 'AC Repair', 'Oil Change'], credentials: ['ASE Certified', 'Maruti Authorized'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-010', email: 'amit.gupta@servizo.in', password: 'Amit@2024',
      name: 'Amit Gupta', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=amit-g',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'shreya-k', userId: 'WORKER-011', name: 'Shreya Kulkarni',
      title: 'Smart Home Installer', category: 'Automation',
      description: 'Complete smart home setup including CCTV, smart locks, and energy monitoring in Kandivali.',
      tags: ['CCTV', 'Smart Lock', 'Energy Monitor'], hourlyRate: 1300, rating: 4.87, experience: 5, projects: 290,
      location: 'Kandivali West, Mumbai', lat: 19.2100, lng: 72.8290,
      avatar: 'https://i.pravatar.cc/150?u=shreya-k',
      skills: ['CCTV Setup', 'Smart Locks', 'Zigbee/Z-Wave'], credentials: ['Hikvision Certified', 'Automation World Cert'],
      availability: 'available', verified: true, backgroundChecked: true, insuranceVerified: true,
    },
    user: {
      id: 'WORKER-011', email: 'shreya.kulkarni@servizo.in', password: 'Shreya@2024',
      name: 'Shreya Kulkarni', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=shreya-k',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── ANDHERI ───────────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'nitin-v', userId: 'WORKER-012', name: 'Nitin Verma',
      title: 'Architectural Designer', category: 'Architecture',
      description: 'Boutique residential projects, interior architecture, and permit drawings in Andheri.',
      tags: ['Boutique', 'Permit Drawing', 'Residential'], hourlyRate: 2200, rating: 4.94, experience: 9, projects: 380,
      location: 'Andheri West, Mumbai', lat: 19.1360, lng: 72.8296,
      avatar: 'https://i.pravatar.cc/150?u=nitin-v',
      skills: ['SketchUp', 'AutoCAD', 'Client Liaison'], credentials: ['COA Registered', 'SPA Delhi'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true, fastResponder: true,
    },
    user: {
      id: 'WORKER-012', email: 'nitin.verma@servizo.in', password: 'Nitin@2024',
      name: 'Nitin Verma', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=nitin-v',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'rekha-t', userId: 'WORKER-013', name: 'Rekha Tiwari',
      title: 'Electrician & AC Technician', category: 'Electrical',
      description: 'Split AC installation, servicing, and general electrical work throughout Andheri and Jogeshwari.',
      tags: ['AC Install', 'AC Service', 'Wiring'], hourlyRate: 850, rating: 4.73, experience: 6, projects: 460,
      location: 'Andheri East, Mumbai', lat: 19.1145, lng: 72.8687,
      avatar: 'https://i.pravatar.cc/150?u=rekha-t',
      skills: ['Split AC', 'Cassette AC', 'Wiring'], credentials: ['ITI Refrigeration', 'ESCI Certified'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-013', email: 'rekha.tiwari@servizo.in', password: 'Rekha@2024',
      name: 'Rekha Tiwari', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=rekha-t',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'suresh-b', userId: 'WORKER-014', name: 'Suresh Bisht',
      title: 'Plumber & Sanitary Expert', category: 'Plumbing',
      description: 'Bathroom renovation, concealed pipe work, and drainage solutions in Andheri.',
      tags: ['Concealed Pipe', 'Drainage', 'Renovation'], hourlyRate: 780, rating: 4.77, experience: 11, projects: 930,
      location: 'Andheri West, Mumbai', lat: 19.1390, lng: 72.8270,
      avatar: 'https://i.pravatar.cc/150?u=suresh-b',
      skills: ['CPVC Piping', 'Drainage Design', 'Tile Work'], credentials: ['CPWD', 'CIDC Trained'],
      availability: 'busy', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-014', email: 'suresh.bisht@servizo.in', password: 'Suresh@2024',
      name: 'Suresh Bisht', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=suresh-b',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── MALAD ─────────────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'farhan-q', userId: 'WORKER-015', name: 'Farhan Qureshi',
      title: 'HVAC & Automation Engineer', category: 'Automation',
      description: 'Commercial and residential HVAC design, BMS integration, and energy audit services in Malad.',
      tags: ['HVAC', 'BMS', 'Energy Audit'], hourlyRate: 1800, rating: 4.90, experience: 10, projects: 520,
      location: 'Malad West, Mumbai', lat: 19.1870, lng: 72.8483,
      avatar: 'https://i.pravatar.cc/150?u=farhan-q',
      skills: ['HVAC Design', 'BMS', 'ASHRAE Standards'], credentials: ['ASHRAE Member', 'ISHRAE Certified'],
      availability: 'available', verified: true, backgroundChecked: true, insuranceVerified: true,
    },
    user: {
      id: 'WORKER-015', email: 'farhan.qureshi@servizo.in', password: 'Farhan@2024',
      name: 'Farhan Qureshi', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=farhan-q',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'ananya-c', userId: 'WORKER-016', name: 'Ananya Chawla',
      title: 'Interior & Furniture Designer', category: 'Aesthetics',
      description: 'Custom modular furniture, kitchen design, and home makeovers across Malad and Goregaon.',
      tags: ['Modular Kitchen', 'Custom Furniture', 'Makeover'], hourlyRate: 1350, rating: 4.96, experience: 7, projects: 290,
      location: 'Malad East, Mumbai', lat: 19.1840, lng: 72.8600,
      avatar: 'https://i.pravatar.cc/150?u=ananya-c',
      skills: ['Modular Design', '3D Visualization', 'Project Management'], credentials: ['JD Institute', 'IGBC Green'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true,
    },
    user: {
      id: 'WORKER-016', email: 'ananya.chawla@servizo.in', password: 'Ananya@2024',
      name: 'Ananya Chawla', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=ananya-c',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'kiran-p', userId: 'WORKER-017', name: 'Kiran Pawar',
      title: 'Vehicle & Generator Mechanic', category: 'Mechanical',
      description: 'Diesel generator repair, two-wheeler servicing, and fleet maintenance in Malad.',
      tags: ['Generator', 'Two Wheeler', 'Fleet'], hourlyRate: 700, rating: 4.72, experience: 14, projects: 1350,
      location: 'Malad West, Mumbai', lat: 19.1900, lng: 72.8460,
      avatar: 'https://i.pravatar.cc/150?u=kiran-p',
      skills: ['DG Set Repair', 'Two Wheeler', 'Fleet Service'], credentials: ['ITI Mechanic', 'Honda Certified'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-017', email: 'kiran.pawar@servizo.in', password: 'Kiran@2024',
      name: 'Kiran Pawar', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=kiran-p',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── GOREGAON ──────────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'tanvir-a', userId: 'WORKER-018', name: 'Tanvir Ahmed',
      title: 'Electrician & Panel Technician', category: 'Electrical',
      description: 'Industrial and residential electrical work, AMF panel installation and maintenance in Goregaon.',
      tags: ['AMF Panel', 'Industrial', 'Residential'], hourlyRate: 1000, rating: 4.84, experience: 8, projects: 580,
      location: 'Goregaon East, Mumbai', lat: 19.1640, lng: 72.8640,
      avatar: 'https://i.pravatar.cc/150?u=tanvir-a',
      skills: ['AMF Panel', 'Earthing', 'Cable Tray'], credentials: ['ITI Electrician', 'IEEMA Member'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-018', email: 'tanvir.ahmed@servizo.in', password: 'Tanvir@2024',
      name: 'Tanvir Ahmed', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=tanvir-a',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'lata-m', userId: 'WORKER-019', name: 'Lata Menon',
      title: 'Architect & Urban Designer', category: 'Architecture',
      description: 'Mixed-use developments, urban planning consultancy, and residential architecture in Goregaon.',
      tags: ['Urban Design', 'Mixed Use', 'Residential'], hourlyRate: 2400, rating: 4.97, experience: 15, projects: 670,
      location: 'Goregaon West, Mumbai', lat: 19.1620, lng: 72.8490,
      avatar: 'https://i.pravatar.cc/150?u=lata-m',
      skills: ['Urban Planning', 'Revit', 'LEED Design'], credentials: ['COA', 'LEED AP', 'CEPT Ahmedabad'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true, insuranceVerified: true,
    },
    user: {
      id: 'WORKER-019', email: 'lata.menon@servizo.in', password: 'Lata@2024',
      name: 'Lata Menon', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=lata-m',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── JOGESHWARI / VILE PARLE ───────────────────────────────────────────────
  {
    specialist: {
      id: 'gaurav-s', userId: 'WORKER-020', name: 'Gaurav Sawant',
      title: 'Plumbing Contractor', category: 'Plumbing',
      description: 'New construction plumbing, overhead tank cleaning, and AMC services in Jogeshwari.',
      tags: ['Construction', 'Tank Cleaning', 'AMC'], hourlyRate: 820, rating: 4.79, experience: 10, projects: 760,
      location: 'Jogeshwari West, Mumbai', lat: 19.1480, lng: 72.8340,
      avatar: 'https://i.pravatar.cc/150?u=gaurav-s',
      skills: ['GI Piping', 'Tank Cleaning', 'AMC'], credentials: ['ITI Plumber', 'NSDC Certified'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-020', email: 'gaurav.sawant@servizo.in', password: 'Gaurav@2024',
      name: 'Gaurav Sawant', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=gaurav-s',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'priyanka-d', userId: 'WORKER-021', name: 'Priyanka Dubey',
      title: 'Aesthetic Consultant & Painter', category: 'Aesthetics',
      description: 'Decorative wall paintings, textured finish, and premium paint consultancy in Vile Parle.',
      tags: ['Textured Paint', 'Decorative', 'Premium'], hourlyRate: 950, rating: 4.88, experience: 5, projects: 220,
      location: 'Vile Parle West, Mumbai', lat: 19.1007, lng: 72.8405,
      avatar: 'https://i.pravatar.cc/150?u=priyanka-d',
      skills: ['Texture Painting', 'Stencil Art', 'Asian Paints Pro'], credentials: ['Asian Paints Certified', 'IGBC Member'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-021', email: 'priyanka.dubey@servizo.in', password: 'Priyanka@2024',
      name: 'Priyanka Dubey', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=priyanka-d',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── DADAR / PAREL ─────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'ravi-k', userId: 'WORKER-022', name: 'Ravi Kadam',
      title: 'Civil & Structural Engineer', category: 'Architecture',
      description: 'Structural audits, RCC design, and building renovation consultancy in Dadar and Mahim.',
      tags: ['Structural Audit', 'RCC', 'Renovation'], hourlyRate: 1900, rating: 4.86, experience: 13, projects: 490,
      location: 'Dadar West, Mumbai', lat: 19.0178, lng: 72.8478,
      avatar: 'https://i.pravatar.cc/150?u=ravi-k',
      skills: ['STAAD Pro', 'RCC Design', 'Site Supervision'], credentials: ['COA', 'IEI Member', 'VJTI Mumbai'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-022', email: 'ravi.kadam@servizo.in', password: 'Ravi@2024',
      name: 'Ravi Kadam', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=ravi-k',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'suman-l', userId: 'WORKER-023', name: 'Suman Lohia',
      title: 'Industrial Electrician', category: 'Electrical',
      description: 'Factory wiring, transformer maintenance, and power factor correction across Central Mumbai.',
      tags: ['Industrial', 'Transformer', 'Power Factor'], hourlyRate: 1100, rating: 4.81, experience: 16, projects: 820,
      location: 'Parel, Mumbai', lat: 19.0000, lng: 72.8410,
      avatar: 'https://i.pravatar.cc/150?u=suman-l',
      skills: ['HT Wiring', 'Transformer Maint.', 'Power Factor'], credentials: ['IEEMA', 'MSEDCL Licensed', 'CGLI'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true,
    },
    user: {
      id: 'WORKER-023', email: 'suman.lohia@servizo.in', password: 'Suman@2024',
      name: 'Suman Lohia', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=suman-l',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── THANE ─────────────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'harsh-w', userId: 'WORKER-024', name: 'Harsh Wagh',
      title: 'Mechanical & HVAC Technician', category: 'Mechanical',
      description: 'Industrial machinery servicing, chiller plant maintenance, and HVAC repair in Thane.',
      tags: ['Chiller', 'HVAC', 'Industrial'], hourlyRate: 1200, rating: 4.83, experience: 11, projects: 640,
      location: 'Thane West, Mumbai', lat: 19.2183, lng: 72.9781,
      avatar: 'https://i.pravatar.cc/150?u=harsh-w',
      skills: ['Chiller Maintenance', 'HVAC', 'Pneumatics'], credentials: ['ISHRAE', 'NSDC Mechanical'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-024', email: 'harsh.wagh@servizo.in', password: 'Harsh@2024',
      name: 'Harsh Wagh', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=harsh-w',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'divya-a', userId: 'WORKER-025', name: 'Divya Agarwal',
      title: 'Smart Building Automation', category: 'Automation',
      description: 'BMS, access control, and fire alarm system integration for commercial buildings in Thane.',
      tags: ['BMS', 'Access Control', 'Fire Alarm'], hourlyRate: 1600, rating: 4.89, experience: 8, projects: 340,
      location: 'Thane East, Mumbai', lat: 19.2150, lng: 72.9900,
      avatar: 'https://i.pravatar.cc/150?u=divya-a',
      skills: ['BMS', 'Access Control', 'Fire Safety'], credentials: ['Siemens Building', 'NFPA Certified'],
      availability: 'available', verified: true, backgroundChecked: true, fastResponder: true, insuranceVerified: true,
    },
    user: {
      id: 'WORKER-025', email: 'divya.agarwal@servizo.in', password: 'Divya@2024',
      name: 'Divya Agarwal', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=divya-a',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── MIRA ROAD ─────────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'nilesh-c', userId: 'WORKER-026', name: 'Nilesh Chougule',
      title: 'Plumber & Pump Specialist', category: 'Plumbing',
      description: 'Borewell pump, pressure booster, and domestic plumbing installations in Mira Road.',
      tags: ['Borewell', 'Booster Pump', 'Domestic'], hourlyRate: 760, rating: 4.75, experience: 9, projects: 590,
      location: 'Mira Road, Mumbai', lat: 19.2812, lng: 72.8686,
      avatar: 'https://i.pravatar.cc/150?u=nilesh-c',
      skills: ['Pump Install', 'UPVC Piping', 'Borewell'], credentials: ['ITI Plumber', 'Grundfos Partner'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-026', email: 'nilesh.chougule@servizo.in', password: 'Nilesh@2024',
      name: 'Nilesh Chougule', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=nilesh-c',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'rashida-b', userId: 'WORKER-027', name: 'Rashida Baig',
      title: 'Interior Designer', category: 'Aesthetics',
      description: 'Luxury residential interiors with a fusion of contemporary and traditional aesthetics — Mira Road.',
      tags: ['Luxury', 'Fusion', 'Residential'], hourlyRate: 1400, rating: 4.92, experience: 8, projects: 260,
      location: 'Mira Road, Mumbai', lat: 19.2850, lng: 72.8700,
      avatar: 'https://i.pravatar.cc/150?u=rashida-b',
      skills: ['Luxury Design', 'Space Planning', 'FF&E'], credentials: ['Pearl Academy', 'IIID Member'],
      availability: 'busy', verified: true, backgroundChecked: true, topRated: true,
    },
    user: {
      id: 'WORKER-027', email: 'rashida.baig@servizo.in', password: 'Rashida@2024',
      name: 'Rashida Baig', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=rashida-b',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── NAVI MUMBAI ───────────────────────────────────────────────────────────
  {
    specialist: {
      id: 'sameer-f', userId: 'WORKER-028', name: 'Sameer Fernandes',
      title: 'Electrical Project Manager', category: 'Electrical',
      description: 'End-to-end electrical project management for commercial and high-rise residential projects in Navi Mumbai.',
      tags: ['Project Management', 'High Rise', 'Commercial'], hourlyRate: 1700, rating: 4.90, experience: 14, projects: 920,
      location: 'Vashi, Navi Mumbai', lat: 19.0760, lng: 72.9980,
      avatar: 'https://i.pravatar.cc/150?u=sameer-f',
      skills: ['HV/LV Design', 'Project Mgmt', 'Commissioning'], credentials: ['IEI', 'PMP Certified', 'VJTI'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true, insuranceVerified: true,
    },
    user: {
      id: 'WORKER-028', email: 'sameer.fernandes@servizo.in', password: 'Sameer@2024',
      name: 'Sameer Fernandes', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=sameer-f',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'yogesh-t', userId: 'WORKER-029', name: 'Yogesh Tambe',
      title: 'Automotive Restoration Expert', category: 'Mechanical',
      description: 'Classic car restoration, engine rebuilds, and detailing services in Navi Mumbai.',
      tags: ['Restoration', 'Engine Rebuild', 'Detailing'], hourlyRate: 1500, rating: 4.94, experience: 18, projects: 1500,
      location: 'Kharghar, Navi Mumbai', lat: 19.0474, lng: 73.0691,
      avatar: 'https://i.pravatar.cc/150?u=yogesh-t',
      skills: ['Engine Rebuild', 'Bodywork', 'Paint Correction'], credentials: ['ASE Master Tech', 'ICAR Certified'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true,
    },
    user: {
      id: 'WORKER-029', email: 'yogesh.tambe@servizo.in', password: 'Yogesh@2024',
      name: 'Yogesh Tambe', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=yogesh-t',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'archana-g', userId: 'WORKER-030', name: 'Archana Gaikwad',
      title: 'Architect & Sustainable Designer', category: 'Architecture',
      description: 'Green building design, GRIHA certification consultancy, and sustainable homes in Navi Mumbai.',
      tags: ['Green Building', 'GRIHA', 'Sustainable'], hourlyRate: 2100, rating: 4.93, experience: 10, projects: 310,
      location: 'Belapur, Navi Mumbai', lat: 19.0228, lng: 73.0385,
      avatar: 'https://i.pravatar.cc/150?u=archana-g',
      skills: ['Green Design', 'GRIHA', 'Passive Cooling'], credentials: ['COA', 'GRIHA Evaluator', 'CEPT'],
      availability: 'available', verified: true, backgroundChecked: true, topRated: true,
    },
    user: {
      id: 'WORKER-030', email: 'archana.gaikwad@servizo.in', password: 'Archana@2024',
      name: 'Archana Gaikwad', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=archana-g',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },

  // ── EXTRA BORIVALI / KANDIVALI ────────────────────────────────────────────
  {
    specialist: {
      id: 'mahesh-r', userId: 'WORKER-031', name: 'Mahesh Raut',
      title: 'Plumber & Waterproofing Pro', category: 'Plumbing',
      description: 'Bathroom leakage specialist, sump cleaning, and underground pipeline work in Borivali.',
      tags: ['Leakage', 'Sump Cleaning', 'Underground'], hourlyRate: 790, rating: 4.80, experience: 8, projects: 670,
      location: 'Borivali East, Mumbai', lat: 19.2325, lng: 72.8718,
      avatar: 'https://i.pravatar.cc/150?u=mahesh-r',
      skills: ['Leakage Detection', 'Sump Cleaning', 'Pipe Lining'], credentials: ['CPWD', 'NSDC Plumbing'],
      availability: 'available', verified: true, backgroundChecked: true,
    },
    user: {
      id: 'WORKER-031', email: 'mahesh.raut@servizo.in', password: 'Mahesh@2024',
      name: 'Mahesh Raut', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=mahesh-r',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
  {
    specialist: {
      id: 'snehal-k', userId: 'WORKER-032', name: 'Snehal Kamble',
      title: 'Solar & Electrical Technician', category: 'Electrical',
      description: 'Rooftop solar panel installation, net metering setup, and battery storage systems in Kandivali.',
      tags: ['Solar', 'Net Metering', 'Battery Storage'], hourlyRate: 980, rating: 4.87, experience: 6, projects: 350,
      location: 'Kandivali West, Mumbai', lat: 19.2120, lng: 72.8260,
      avatar: 'https://i.pravatar.cc/150?u=snehal-k',
      skills: ['Solar PV', 'Net Metering', 'Li-ion Battery'], credentials: ['MNRE Certified', 'SECI Empanelled'],
      availability: 'available', verified: true, backgroundChecked: true, fastResponder: true,
    },
    user: {
      id: 'WORKER-032', email: 'snehal.kamble@servizo.in', password: 'Snehal@2024',
      name: 'Snehal Kamble', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=snehal-k',
      createdAt: new Date().toISOString(), favorites: [], verificationStatus: 'approved',
    },
  },
];

export async function seedNewWorkers(): Promise<{ seeded: number; skipped: number }> {
  let seeded = 0;
  let skipped = 0;

  for (const { specialist, user } of NEW_WORKERS) {
    const specSnap = await getDoc(doc(db, 'specialists', specialist.id));
    if (!specSnap.exists()) {
      await setDoc(doc(db, 'specialists', specialist.id), specialist);
      seeded++;
    } else {
      // Update verificationStatus on existing user docs that may be missing it
      skipped++;
    }

    const userSnap = await getDoc(doc(db, 'users', user.id));
    if (!userSnap.exists()) {
      await setDoc(doc(db, 'users', user.id), user);
    } else {
      // Patch verificationStatus if missing
      const existing = userSnap.data();
      if (!existing.verificationStatus) {
        await setDoc(doc(db, 'users', user.id), { ...existing, verificationStatus: 'approved' });
      }
    }
  }

  return { seeded, skipped };
}
