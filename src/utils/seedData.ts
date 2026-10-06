/**
 * QuoteWise – Sample Data Seeder
 * Run this once after setting up Firebase to populate demo data.
 *
 * Usage:
 *   1. Import and call seedDemoData(userProfile) from your app
 *   2. Or call it from the browser console once logged in
 *
 * The seeder creates realistic demo data for:
 * - 5 vendors
 * - 3 requirements
 * - 10+ quotations
 */

import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

const SAMPLE_VENDORS = [
  {
    name: 'Rajesh Kumar',
    company: 'TechStar Solutions Pvt. Ltd.',
    email: 'rajesh@techstar.in',
    phone: '+91 98765 43210',
    category: 'IT & Electronics',
    rating: 4.5,
    address: '42, Cyber Park, Gurugram, Haryana',
    notes: 'Reliable IT hardware supplier with pan-India delivery',
  },
  {
    name: 'Priya Sharma',
    company: 'GreenOffice Supplies Co.',
    email: 'priya@greenoffice.com',
    phone: '+91 87654 32109',
    category: 'Office Supplies',
    rating: 4.2,
    address: '15, Andheri East, Mumbai, Maharashtra',
    notes: 'Eco-friendly office products, bulk discounts available',
  },
  {
    name: 'Mohammed Aslam',
    company: 'NetConnect Systems',
    email: 'aslam@netconnect.in',
    phone: '+91 76543 21098',
    category: 'Networking Equipment',
    rating: 4.7,
    address: '8, Electronic City, Bengaluru, Karnataka',
    notes: 'Certified Cisco and HP networking reseller',
  },
  {
    name: 'Sunita Patel',
    company: 'Premier Furniture World',
    email: 'sunita@premierfurniture.com',
    phone: '+91 65432 10987',
    category: 'Furniture',
    rating: 4.1,
    address: '22, MIDC, Pune, Maharashtra',
    notes: 'Custom office furniture manufacturing',
  },
  {
    name: 'Arjun Mehta',
    company: 'PrintMaster India',
    email: 'arjun@printmaster.in',
    phone: '+91 54321 09876',
    category: 'IT & Electronics',
    rating: 3.9,
    address: '5, Connaught Place, New Delhi',
    notes: 'Printers, cartridges and accessories specialist',
  },
];

const SAMPLE_REQUIREMENTS = [
  {
    title: '50 Business Laptops',
    description: 'High-performance laptops for the engineering team. Must support 16GB RAM, SSD storage.',
    category: 'IT Equipment',
    quantity: 50,
    unit: 'units',
    budget: 2500000,
    maxBudget: 2500000,
    maxDeliveryDays: 10,
    minWarrantyMonths: 18,
    minVendorRating: 4.2,
    status: 'Open' as const,
  },
  {
    title: '200 Ergonomic Office Chairs',
    description: 'Ergonomic chairs with lumbar support for the new office floor expansion.',
    category: 'Furniture',
    quantity: 200,
    unit: 'units',
    budget: 800000,
    maxBudget: 800000,
    maxDeliveryDays: 15,
    minWarrantyMonths: 12,
    minVendorRating: 4.0,
    status: 'Under Review' as const,
  },
  {
    title: 'Networking Equipment Upgrade',
    description: 'Replace old switches and routers with Gigabit Ethernet equipment for the main office.',
    category: 'Networking',
    quantity: 1,
    unit: 'lot',
    budget: 350000,
    maxBudget: 350000,
    maxDeliveryDays: 7,
    minWarrantyMonths: 12,
    minVendorRating: 4.0,
    status: 'Open' as const,
  },
];

export const seedDemoData = async (companyName: string, userId: string, userName: string) => {
  console.log('🌱 Seeding demo data for company:', companyName);

  // Create vendors
  const vendorIds: string[] = [];
  for (const v of SAMPLE_VENDORS) {
    const ref = await addDoc(collection(db, 'vendors'), {
      ...v,
      companyId: companyName,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    vendorIds.push(ref.id);
    console.log('✅ Vendor created:', v.company);
  }

  // Create requirements and quotations
  const deadlines = [
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
  ];

  const quotationData = [
    // Requirement 0 (Laptops) - 3 quotations
    [
      { vendorIdx: 0, price: 2100000, warrantyMonths: 24, deliveryDays: 5, vendorRating: 4.5 },
      { vendorIdx: 2, price: 1950000, warrantyMonths: 12, deliveryDays: 10, vendorRating: 4.1 },
      { vendorIdx: 4, price: 2200000, warrantyMonths: 36, deliveryDays: 4, vendorRating: 4.7 },
    ],
    // Requirement 1 (Chairs) - 2 quotations
    [
      { vendorIdx: 1, price: 720000, warrantyMonths: 12, deliveryDays: 14, vendorRating: 4.2 },
      { vendorIdx: 3, price: 680000, warrantyMonths: 24, deliveryDays: 7, vendorRating: 4.1 },
    ],
    // Requirement 2 (Networking) - 3 quotations
    [
      { vendorIdx: 2, price: 320000, warrantyMonths: 36, deliveryDays: 3, vendorRating: 4.7 },
      { vendorIdx: 0, price: 295000, warrantyMonths: 12, deliveryDays: 7, vendorRating: 4.5 },
      { vendorIdx: 4, price: 310000, warrantyMonths: 24, deliveryDays: 5, vendorRating: 3.9 },
    ],
  ];

  for (let i = 0; i < SAMPLE_REQUIREMENTS.length; i++) {
    const req = SAMPLE_REQUIREMENTS[i];
    const reqRef = await addDoc(collection(db, 'requirements'), {
      ...req,
      deadline: Timestamp.fromDate(deadlines[i]),
      companyId: companyName,
      createdBy: userId,
      createdByName: userName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Requirement created:', req.title);

    // Create quotations for this requirement
    for (const q of quotationData[i]) {
      const vendor = SAMPLE_VENDORS[q.vendorIdx];
      const vendorId = vendorIds[q.vendorIdx];
      await addDoc(collection(db, 'quotations'), {
        requirementId: reqRef.id,
        requirementTitle: req.title,
        vendorId,
        vendorName: vendor.name,
        vendorCompany: vendor.company,
        price: q.price,
        warrantyMonths: q.warrantyMonths,
        deliveryDays: q.deliveryDays,
        vendorRating: q.vendorRating,
        notes: `Demo quotation from ${vendor.company}`,
        companyId: companyName,
        createdBy: userId,
        submittedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
      console.log('✅ Quotation created for', req.title, '←', vendor.company);
    }
  }

  console.log('🎉 Demo data seeding complete!');
};
