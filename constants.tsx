
import { Business } from './types';

export const MOCK_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'City Health Center',
    category: 'Healthcare',
    location: '123 Medical Dr, Downtown',
    imageUrl: 'https://picsum.photos/seed/hosp/800/400',
    services: [
      { id: 'h1', name: 'General Consultation', description: 'Routine checkups and non-emergencies', averageServiceTime: 15 },
      { id: 'h2', name: 'Vaccination', description: 'Flu, COVID, and other immunizations', averageServiceTime: 10 },
      { id: 'h3', name: 'Pharmacy Pickup', description: 'Collect prescribed medications', averageServiceTime: 5 }
    ]
  },
  {
    id: '2',
    name: 'Metropolis Bank',
    category: 'Finance',
    location: '456 Wealth Ave, Financial District',
    imageUrl: 'https://picsum.photos/seed/bank/800/400',
    services: [
      { id: 'b1', name: 'Teller Services', description: 'Deposits, withdrawals, and cash services', averageServiceTime: 8 },
      { id: 'b2', name: 'Account Opening', description: 'Open new savings or checking accounts', averageServiceTime: 30 },
      { id: 'b3', name: 'Loan Consultation', description: 'Mortgages, personal, and business loans', averageServiceTime: 45 }
    ]
  },
  {
    id: '3',
    name: 'Gourmet Central',
    category: 'Dining',
    location: '789 Flavor St, Midtown',
    imageUrl: 'https://picsum.photos/seed/food/800/400',
    services: [
      { id: 'f1', name: 'Dine-In Waiting List', description: 'Get a table for your group', averageServiceTime: 40 },
      { id: 'f2', name: 'Takeaway Collection', description: 'Pick up your pre-ordered meal', averageServiceTime: 5 }
    ]
  }
];
