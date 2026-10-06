import type { Requirement, Vendor, Quotation, Comparison, AppUser } from '../types';

export const INITIAL_DEMO_VENDORS: Vendor[] = [
  {
    id: 'vend-001',
    name: 'Rajesh Kumar',
    company: 'TechStar Solutions Pvt Ltd',
    email: 'rajesh@techstarsolutions.com',
    phone: '+91 98765 43210',
    category: 'IT & Electronics',
    rating: 4.8,
    address: '42, Cyber Gateway, Gurugram, Haryana',
    notes: 'Tier-1 enterprise hardware supplier with pan-India warranty support.',
    companyId: 'Acme Procurement Corp',
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-01-10T10:00:00Z'),
    updatedAt: new Date('2026-01-10T10:00:00Z'),
  },
  {
    id: 'vend-002',
    name: 'Priya Sharma',
    company: 'InfraSys Global Networks',
    email: 'priya.s@infrasys.io',
    phone: '+91 98111 22334',
    category: 'Networking Equipment',
    rating: 4.5,
    address: '15, Electronic City Phase 1, Bengaluru, Karnataka',
    notes: 'Certified Cisco & Aruba gold partner with prompt logistics.',
    companyId: 'Acme Procurement Corp',
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-01-12T11:00:00Z'),
    updatedAt: new Date('2026-01-12T11:00:00Z'),
  },
  {
    id: 'vend-003',
    name: 'Arjun Mehta',
    company: 'Apex Cloud & Hardware Hub',
    email: 'arjun@apexcloudhub.com',
    phone: '+91 99200 33445',
    category: 'IT & Electronics',
    rating: 4.2,
    address: '88, Andheri East, Mumbai, Maharashtra',
    notes: 'Competitive pricing, specialized in volume discounts.',
    companyId: 'Acme Procurement Corp',
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-01-15T09:30:00Z'),
    updatedAt: new Date('2026-01-15T09:30:00Z'),
  },
  {
    id: 'vend-004',
    name: 'Sunita Verma',
    company: 'ErgoCraft Workspaces',
    email: 'sunita@ergocraft.in',
    phone: '+91 97333 44556',
    category: 'Furniture',
    rating: 4.6,
    address: '24, MIDC Industrial Area, Pune, Maharashtra',
    notes: 'Ergonomic commercial office furniture with 5-year structural warranty.',
    companyId: 'Acme Procurement Corp',
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-01-18T14:00:00Z'),
    updatedAt: new Date('2026-01-18T14:00:00Z'),
  },
  {
    id: 'vend-005',
    name: 'Vikram Malhotra',
    company: 'Zenith FastTrack Logistics & IT',
    email: 'vikram@zenithfasttrack.com',
    phone: '+91 98999 55667',
    category: 'IT & Electronics',
    rating: 4.0,
    address: '102, Connaught Place, New Delhi',
    notes: 'Fastest turn-around time, ready stock available.',
    companyId: 'Acme Procurement Corp',
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-01-20T16:00:00Z'),
    updatedAt: new Date('2026-01-20T16:00:00Z'),
  },
];

export const INITIAL_DEMO_REQUIREMENTS: Requirement[] = [
  {
    id: 'req-001',
    title: 'Enterprise Laptops Upgrade (50 Units)',
    description: 'Procurement of 50 units high-performance laptops (Intel Core i7/16GB RAM/512GB SSD) for engineering team.',
    category: 'IT Equipment',
    quantity: 50,
    unit: 'Units',
    budget: 4500000,
    deadline: new Date('2026-04-15T00:00:00Z'),
    status: 'Open',
    maxBudget: 4500000,
    maxDeliveryDays: 20,
    minWarrantyMonths: 18,
    minVendorRating: 4.0,
    createdBy: 'demo-admin-uid-101',
    createdByName: 'Alex Morgan',
    companyId: 'Acme Procurement Corp',
    createdAt: new Date('2026-02-01T10:00:00Z'),
    updatedAt: new Date('2026-02-01T10:00:00Z'),
  },
  {
    id: 'req-002',
    title: 'Data Center Rack & Switching Overhaul',
    description: 'High-throughput 10GbE managed switch units, CAT6A cabling, and rack cooling modules for secondary data center.',
    category: 'Networking',
    quantity: 1,
    unit: 'Lot',
    budget: 1800000,
    deadline: new Date('2026-04-30T00:00:00Z'),
    status: 'Under Review',
    createdBy: 'demo-admin-uid-101',
    createdByName: 'Alex Morgan',
    companyId: 'Acme Procurement Corp',
    createdAt: new Date('2026-02-05T12:00:00Z'),
    updatedAt: new Date('2026-02-05T12:00:00Z'),
  },
  {
    id: 'req-003',
    title: 'Ergonomic Standing Desks & Chairs (100 Sets)',
    description: 'Dual-motor motorized height-adjustable desks with mesh ergonomic lumbar support chairs for Bangalore HQ expansion.',
    category: 'Furniture',
    quantity: 100,
    unit: 'Sets',
    budget: 2800000,
    deadline: new Date('2026-05-10T00:00:00Z'),
    status: 'Draft',
    createdBy: 'demo-employee-uid-102',
    createdByName: 'Sarah Jenkins',
    companyId: 'Acme Procurement Corp',
    createdAt: new Date('2026-02-10T15:30:00Z'),
    updatedAt: new Date('2026-02-10T15:30:00Z'),
  },
];

export const INITIAL_DEMO_QUOTATIONS: Quotation[] = [
  {
    id: 'quot-001',
    requirementId: 'req-001',
    requirementTitle: 'Enterprise Laptops Upgrade (50 Units)',
    vendorId: 'vend-001',
    vendorName: 'Rajesh Kumar',
    vendorCompany: 'TechStar Solutions Pvt Ltd',
    price: 4250000,
    warrantyMonths: 36,
    deliveryDays: 14,
    vendorRating: 4.8,
    notes: 'Includes 3 years comprehensive onsite OEM warranty and next-business-day response.',
    companyId: 'Acme Procurement Corp',
    submittedAt: new Date('2026-02-03T11:00:00Z'),
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-02-03T11:00:00Z'),
  },
  {
    id: 'quot-002',
    requirementId: 'req-001',
    requirementTitle: 'Enterprise Laptops Upgrade (50 Units)',
    vendorId: 'vend-003',
    vendorName: 'Arjun Mehta',
    vendorCompany: 'Apex Cloud & Hardware Hub',
    price: 3950000,
    warrantyMonths: 12,
    deliveryDays: 25,
    vendorRating: 4.2,
    notes: 'Lowest unit price. Standard 1-year depot warranty. Delivery in 25 working days.',
    companyId: 'Acme Procurement Corp',
    submittedAt: new Date('2026-02-04T14:30:00Z'),
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-02-04T14:30:00Z'),
  },
  {
    id: 'quot-003',
    requirementId: 'req-001',
    requirementTitle: 'Enterprise Laptops Upgrade (50 Units)',
    vendorId: 'vend-005',
    vendorName: 'Vikram Malhotra',
    vendorCompany: 'Zenith FastTrack Logistics & IT',
    price: 4400000,
    warrantyMonths: 24,
    deliveryDays: 5,
    vendorRating: 4.0,
    notes: 'Ready stock in Gurgaon warehouse. Can fulfill within 5 business days with transit insurance.',
    companyId: 'Acme Procurement Corp',
    submittedAt: new Date('2026-02-06T09:00:00Z'),
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-02-06T09:00:00Z'),
  },
  {
    id: 'quot-004',
    requirementId: 'req-002',
    requirementTitle: 'Data Center Rack & Switching Overhaul',
    vendorId: 'vend-002',
    vendorName: 'Priya Sharma',
    vendorCompany: 'InfraSys Global Networks',
    price: 1680000,
    warrantyMonths: 36,
    deliveryDays: 12,
    vendorRating: 4.5,
    notes: 'Turnkey deployment with cable dressing and on-site testing.',
    companyId: 'Acme Procurement Corp',
    submittedAt: new Date('2026-02-07T16:00:00Z'),
    createdBy: 'demo-admin-uid-101',
    createdAt: new Date('2026-02-07T16:00:00Z'),
  },
];

export const INITIAL_DEMO_COMPARISONS: Comparison[] = [
  {
    id: 'comp-001',
    requirementId: 'req-001',
    requirementTitle: 'Enterprise Laptops Upgrade (50 Units)',
    weights: {
      price: 35,
      warranty: 30,
      delivery: 20,
      rating: 15,
    },
    scores: [
      {
        quotationId: 'quot-001',
        vendorId: 'vend-001',
        vendorName: 'Rajesh Kumar',
        vendorCompany: 'TechStar Solutions Pvt Ltd',
        price: 4250000,
        warrantyMonths: 36,
        deliveryDays: 14,
        vendorRating: 4.8,
        priceScore: 92.9,
        warrantyScore: 100,
        deliveryScore: 35.7,
        ratingScore: 100,
        priceContribution: 32.5,
        warrantyContribution: 30.0,
        deliveryContribution: 7.1,
        ratingContribution: 15.0,
        breakdown: [
          { factor: 'price', label: 'Price', rawValue: 4250000, formattedRaw: '₹42,50,000', normalizedScore: 92.9, weight: 35, weightedContribution: 32.5 },
          { factor: 'warranty', label: 'Warranty', rawValue: 36, formattedRaw: '36 mo', normalizedScore: 100, weight: 30, weightedContribution: 30.0 },
          { factor: 'delivery', label: 'Delivery', rawValue: 14, formattedRaw: '14 days', normalizedScore: 35.7, weight: 20, weightedContribution: 7.1 },
          { factor: 'rating', label: 'Rating', rawValue: 4.8, formattedRaw: '★ 4.8', normalizedScore: 100, weight: 15, weightedContribution: 15.0 },
        ],
        finalScore: 84.6,
        isRecommended: true,
        isEligible: true,
        ineligibilityReasons: [],
        redFlags: [],
        highlights: ['Best Warranty', 'Highest Rated'],
      },
      {
        quotationId: 'quot-003',
        vendorId: 'vend-005',
        vendorName: 'Vikram Malhotra',
        vendorCompany: 'Zenith FastTrack Logistics & IT',
        price: 4400000,
        warrantyMonths: 24,
        deliveryDays: 5,
        vendorRating: 4.0,
        priceScore: 89.8,
        warrantyScore: 66.7,
        deliveryScore: 100,
        ratingScore: 83.3,
        priceContribution: 31.4,
        warrantyContribution: 20.0,
        deliveryContribution: 20.0,
        ratingContribution: 12.5,
        breakdown: [
          { factor: 'price', label: 'Price', rawValue: 4400000, formattedRaw: '₹44,00,000', normalizedScore: 89.8, weight: 35, weightedContribution: 31.4 },
          { factor: 'warranty', label: 'Warranty', rawValue: 24, formattedRaw: '24 mo', normalizedScore: 66.7, weight: 30, weightedContribution: 20.0 },
          { factor: 'delivery', label: 'Delivery', rawValue: 5, formattedRaw: '5 days', normalizedScore: 100, weight: 20, weightedContribution: 20.0 },
          { factor: 'rating', label: 'Rating', rawValue: 4.0, formattedRaw: '★ 4.0', normalizedScore: 83.3, weight: 15, weightedContribution: 12.5 },
        ],
        finalScore: 83.9,
        isRecommended: false,
        isEligible: true,
        ineligibilityReasons: [],
        redFlags: [],
        highlights: ['Fastest Delivery'],
      },
      {
        quotationId: 'quot-002',
        vendorId: 'vend-003',
        vendorName: 'Arjun Mehta',
        vendorCompany: 'Apex Cloud & Hardware Hub',
        price: 3950000,
        warrantyMonths: 12,
        deliveryDays: 25,
        vendorRating: 4.2,
        priceScore: 0,
        warrantyScore: 0,
        deliveryScore: 0,
        ratingScore: 0,
        priceContribution: 0,
        warrantyContribution: 0,
        deliveryContribution: 0,
        ratingContribution: 0,
        breakdown: [],
        finalScore: 0,
        isRecommended: false,
        isEligible: false,
        ineligibilityReasons: [
          'Delivery time of 25 days exceeds maximum allowed 20 days',
          'Warranty is 12 months; minimum required is 18 months',
        ],
        redFlags: [
          { id: 'rf-1', vendorId: 'vend-003', vendorName: 'Arjun Mehta', severity: 'CRITICAL', message: 'Delivery exceeds maximum allowed time (25 days vs max 20 days).' },
          { id: 'rf-2', vendorId: 'vend-003', vendorName: 'Arjun Mehta', severity: 'CRITICAL', message: 'Warranty is below required minimum (12 mo vs min 18 mo).' },
        ],
        highlights: ['Ineligible'],
      },
    ],
    recommendedVendorId: 'vend-001',
    recommendedVendorName: 'Rajesh Kumar',
    recommendationReason: 'TechStar Solutions Pvt Ltd achieved the highest overall score of 84.6/100 among all eligible vendors. Key advantages include highest warranty period (36 months) and highest vendor performance rating (4.8/5).',
    recommendationExplanation: {
      summary: 'TechStar Solutions Pvt Ltd is recommended because it achieved the highest overall score of 84.6/100 among all eligible vendors.',
      strengths: [
        'Highest warranty period among eligible vendors (36 months)',
        'Highest vendor performance rating among eligible vendors (4.8/5)',
        'Achieved the highest overall weighted score of 84.6 / 100',
      ],
      tradeoffs: [
        'Delivery turnaround (14 days) is slower than Zenith FastTrack (5 days).',
      ],
      decisionRationale: 'TechStar Solutions Pvt Ltd achieved the highest overall score of 84.6/100 among all eligible vendors. Key advantages include highest warranty period and highest vendor performance rating. Its composite score demonstrates optimal overall procurement value.',
    },
    estimatedSavings: 250000,
    budgetAnalysis: {
      budget: 4500000,
      recommendedPrice: 4250000,
      isWithinBudget: true,
      budgetVariance: 250000,
      averagePrice: 4200000,
      lowestPrice: 3950000,
      highestPrice: 4400000,
      savingsAmount: 250000,
      savingsPercentage: 5.6,
      isAboveAverage: false,
    },
    allRedFlags: [
      { id: 'rf-1', vendorId: 'vend-003', vendorName: 'Arjun Mehta', severity: 'CRITICAL', message: 'Delivery exceeds maximum allowed time (25 days vs max 20 days).' },
      { id: 'rf-2', vendorId: 'vend-003', vendorName: 'Arjun Mehta', severity: 'CRITICAL', message: 'Warranty is below required minimum (12 mo vs min 18 mo).' },
    ],
    constraints: {
      maxBudget: 4500000,
      maxDeliveryDays: 20,
      minWarrantyMonths: 18,
      minVendorRating: 4.0,
    },
    companyId: 'Acme Procurement Corp',
    createdBy: 'demo-admin-uid-101',
    createdByName: 'Alex Morgan',
    createdAt: new Date('2026-02-08T15:00:00Z'),
  },
];

export const createDummyTeam = (companyName: string): AppUser[] => {
  const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'quotewise';
  return [
    {
      uid: 'usr-admin-system-root',
      name: 'System Administrator',
      email: 'admin@quotewise.com',
      companyName,
      role: 'admin',
      department: 'Procurement Governance',
      status: 'active',
      assignedCount: 14,
      createdAt: new Date('2026-01-01T08:00:00Z'),
    },
    {
      uid: 'usr-team-001',
      name: 'Rajesh Kumar',
      email: `rajesh.kumar@${domain}.com`,
      companyName,
      role: 'employee',
      department: 'IT Hardware & Enterprise Sourcing',
      status: 'active',
      assignedCount: 8,
      createdAt: new Date('2026-01-10T09:30:00Z'),
    },
    {
      uid: 'usr-team-002',
      name: 'Priya Sharma',
      email: `priya.sharma@${domain}.com`,
      companyName,
      role: 'employee',
      department: 'Networking & Telecom Procurement',
      status: 'active',
      assignedCount: 6,
      createdAt: new Date('2026-01-14T11:15:00Z'),
    },
    {
      uid: 'usr-team-003',
      name: 'Amit Patel',
      email: `amit.patel@${domain}.com`,
      companyName,
      role: 'employee',
      department: 'Commercial & Price Benchmarking',
      status: 'active',
      assignedCount: 11,
      createdAt: new Date('2026-01-18T14:20:00Z'),
    },
    {
      uid: 'usr-team-004',
      name: 'Sneha Reddy',
      email: `sneha.reddy@${domain}.com`,
      companyName,
      role: 'employee',
      department: 'Vendor Quality & Warranty Auditing',
      status: 'active',
      assignedCount: 5,
      createdAt: new Date('2026-01-22T10:00:00Z'),
    },
    {
      uid: 'usr-team-005',
      name: 'Vikram Singh',
      email: `vikram.singh@${domain}.com`,
      companyName,
      role: 'employee',
      department: 'Supply Chain & Turnaround Operations',
      status: 'active',
      assignedCount: 9,
      createdAt: new Date('2026-02-01T15:45:00Z'),
    },
    {
      uid: 'usr-team-006',
      name: 'Ananya Iyer',
      email: `ananya.iyer@${domain}.com`,
      companyName,
      role: 'admin',
      department: 'Compliance & Audit Oversight',
      status: 'active',
      assignedCount: 12,
      createdAt: new Date('2026-02-05T12:10:00Z'),
    },
    {
      uid: 'usr-team-007',
      name: 'Rohit Verma',
      email: `rohit.verma@${domain}.com`,
      companyName,
      role: 'employee',
      department: 'Facilities & Commercial Contracts',
      status: 'suspended',
      assignedCount: 3,
      createdAt: new Date('2026-02-12T16:30:00Z'),
    },
  ];
};

// In-Memory & LocalStorage persistent repository
class DemoStore {
  private users: AppUser[] = [];
  private vendors: Vendor[] = [];
  private requirements: Requirement[] = [];
  private quotations: Quotation[] = [];
  private comparisons: Comparison[] = [];
  private initialized = false;

  private loadFromStorage() {
    try {
      const u = localStorage.getItem('qw_demo_users');
      const v = localStorage.getItem('qw_demo_vendors');
      const r = localStorage.getItem('qw_demo_requirements');
      const q = localStorage.getItem('qw_demo_quotations');
      const c = localStorage.getItem('qw_demo_comparisons');

      const reg = localStorage.getItem('qw_registered_users');

      this.users = u ? JSON.parse(u) : [...createDummyTeam('QuoteWise Enterprise')];
      if (reg) {
        try {
          const registeredList = JSON.parse(reg) as AppUser[];
          registeredList.forEach((ru) => {
            if (!this.users.some((x) => x.uid === ru.uid || x.email.toLowerCase() === ru.email.toLowerCase())) {
              this.users.unshift({ ...ru, createdAt: new Date(ru.createdAt) });
            }
          });
        } catch { /* ignore */ }
      }
      this.vendors = v ? JSON.parse(v) : [...INITIAL_DEMO_VENDORS];
      this.requirements = r ? JSON.parse(r) : [...INITIAL_DEMO_REQUIREMENTS];
      this.quotations = q ? JSON.parse(q) : [...INITIAL_DEMO_QUOTATIONS];
      this.comparisons = c ? JSON.parse(c) : [...INITIAL_DEMO_COMPARISONS];

      // Convert date strings back to Date objects
      this.users.forEach((item) => { item.createdAt = new Date(item.createdAt); });
      this.vendors.forEach((item) => {
        item.createdAt = new Date(item.createdAt);
        item.updatedAt = new Date(item.updatedAt);
      });
      this.requirements.forEach((item) => {
        item.deadline = new Date(item.deadline);
        item.createdAt = new Date(item.createdAt);
        item.updatedAt = new Date(item.updatedAt);
      });
      this.quotations.forEach((item) => {
        item.submittedAt = new Date(item.submittedAt);
        item.createdAt = new Date(item.createdAt);
      });
      this.comparisons.forEach((item) => {
        item.createdAt = new Date(item.createdAt);
      });
    } catch {
      this.resetDefaults();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('qw_demo_users', JSON.stringify(this.users));
      localStorage.setItem('qw_demo_vendors', JSON.stringify(this.vendors));
      localStorage.setItem('qw_demo_requirements', JSON.stringify(this.requirements));
      localStorage.setItem('qw_demo_quotations', JSON.stringify(this.quotations));
      localStorage.setItem('qw_demo_comparisons', JSON.stringify(this.comparisons));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('qw_users_updated'));
      }
    } catch (err) {
      console.warn('Storage save error:', err);
    }
  }

  private ensureInit() {
    if (!this.initialized) {
      this.loadFromStorage();
      this.initialized = true;
    }
  }

  public resetDefaults() {
    this.users = [...createDummyTeam('QuoteWise Enterprise')];
    this.vendors = [...INITIAL_DEMO_VENDORS];
    this.requirements = [...INITIAL_DEMO_REQUIREMENTS];
    this.quotations = [...INITIAL_DEMO_QUOTATIONS];
    this.comparisons = [...INITIAL_DEMO_COMPARISONS];
    this.saveToStorage();
    this.initialized = true;
  }

  // Users
  public getUsers(companyName?: string): AppUser[] {
    this.ensureInit();
    if (!companyName || !companyName.trim() || companyName.trim().toLowerCase() === 'all') {
      return [...this.users];
    }
    const target = companyName.trim().toLowerCase();
    const existing = this.users.filter((u) => u.companyName && u.companyName.trim().toLowerCase() === target);
    if (existing.length > 0) return existing;

    // Seed realistic team members for the company workspace
    const dummyTeam = createDummyTeam(companyName.trim());
    this.users.push(...dummyTeam);
    this.saveToStorage();
    return dummyTeam;
  }

  public getUser(uid: string): AppUser | null {
    this.ensureInit();
    return this.users.find((u) => u.uid === uid) || null;
  }

  public addUser(user: AppUser) {
    this.ensureInit();
    const idx = this.users.findIndex((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      this.users[idx] = { ...this.users[idx], ...user };
    } else {
      this.users.unshift(user);
    }
    this.saveToStorage();
  }

  public updateUserRole(uid: string, role: 'admin' | 'employee') {
    this.ensureInit();
    const u = this.users.find((x) => x.uid === uid);
    if (u) {
      u.role = role;
      this.saveToStorage();
    }
  }

  public updateUserStatus(uid: string, status: 'active' | 'suspended') {
    this.ensureInit();
    const u = this.users.find((x) => x.uid === uid);
    if (u) {
      u.status = status;
      this.saveToStorage();
    }
  }

  // Requirements
  public getRequirements(companyId: string): Requirement[] {
    this.ensureInit();
    if (!companyId || !companyId.trim()) return [];
    const target = companyId.trim().toLowerCase();
    return this.requirements
      .filter((r) => r.companyId && r.companyId.trim().toLowerCase() === target)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRequirement(id: string, companyId?: string): Requirement | null {
    this.ensureInit();
    const r = this.requirements.find((item) => item.id === id);
    if (!r) return null;
    if (companyId && r.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) {
      return null;
    }
    return r;
  }

  public createRequirement(data: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>): string {
    this.ensureInit();
    const id = `req-${Date.now()}`;
    const newReq: Requirement = {
      ...data,
      id,
      deadline: new Date(data.deadline),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.requirements.unshift(newReq);
    this.saveToStorage();
    return id;
  }

  public updateRequirement(id: string, data: Partial<Omit<Requirement, 'id' | 'createdAt'>>) {
    this.ensureInit();
    const idx = this.requirements.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.requirements[idx] = {
        ...this.requirements[idx],
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : this.requirements[idx].deadline,
        updatedAt: new Date(),
      };
      this.saveToStorage();
    }
  }

  public deleteRequirement(id: string) {
    this.ensureInit();
    this.requirements = this.requirements.filter((r) => r.id !== id);
    this.saveToStorage();
  }

  // Vendors
  public getVendors(companyId: string): Vendor[] {
    this.ensureInit();
    if (!companyId || !companyId.trim()) return [];
    const target = companyId.trim().toLowerCase();
    return this.vendors
      .filter((v) => v.companyId && v.companyId.trim().toLowerCase() === target)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getVendor(id: string, companyId?: string): Vendor | null {
    this.ensureInit();
    const v = this.vendors.find((item) => item.id === id);
    if (!v) return null;
    if (companyId && v.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) {
      return null;
    }
    return v;
  }

  public createVendor(data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): string {
    this.ensureInit();
    const id = `vend-${Date.now()}`;
    const newVendor: Vendor = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vendors.unshift(newVendor);
    this.saveToStorage();
    return id;
  }

  public updateVendor(id: string, data: Partial<Omit<Vendor, 'id' | 'createdAt'>>) {
    this.ensureInit();
    const idx = this.vendors.findIndex((v) => v.id === id);
    if (idx !== -1) {
      this.vendors[idx] = {
        ...this.vendors[idx],
        ...data,
        updatedAt: new Date(),
      };
      this.saveToStorage();
    }
  }

  public deleteVendor(id: string) {
    this.ensureInit();
    this.vendors = this.vendors.filter((v) => v.id !== id);
    this.saveToStorage();
  }

  // Quotations
  public getQuotations(companyId: string): Quotation[] {
    this.ensureInit();
    if (!companyId || !companyId.trim()) return [];
    const target = companyId.trim().toLowerCase();
    return this.quotations
      .filter((q) => q.companyId && q.companyId.trim().toLowerCase() === target)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getQuotationsByRequirement(requirementId: string, companyId?: string): Quotation[] {
    this.ensureInit();
    return this.quotations
      .filter((q) => {
        if (q.requirementId !== requirementId) return false;
        if (companyId && q.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public createQuotation(data: Omit<Quotation, 'id' | 'createdAt'>): string {
    this.ensureInit();
    const id = `quot-${Date.now()}`;
    const newQ: Quotation = {
      ...data,
      id,
      submittedAt: new Date(data.submittedAt),
      createdAt: new Date(),
    };
    this.quotations.unshift(newQ);
    this.saveToStorage();
    return id;
  }

  public updateQuotation(id: string, data: Partial<Omit<Quotation, 'id' | 'createdAt'>>) {
    this.ensureInit();
    const idx = this.quotations.findIndex((q) => q.id === id);
    if (idx !== -1) {
      this.quotations[idx] = {
        ...this.quotations[idx],
        ...data,
      };
      this.saveToStorage();
    }
  }

  public deleteQuotation(id: string) {
    this.ensureInit();
    this.quotations = this.quotations.filter((q) => q.id !== id);
    this.saveToStorage();
  }

  // Comparisons
  public getComparisons(companyId: string): Comparison[] {
    this.ensureInit();
    if (!companyId || !companyId.trim()) return [];
    const target = companyId.trim().toLowerCase();
    return this.comparisons
      .filter((c) => c.companyId && c.companyId.trim().toLowerCase() === target)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getComparison(id: string, companyId?: string): Comparison | null {
    this.ensureInit();
    const c = this.comparisons.find((item) => item.id === id);
    if (!c) return null;
    if (companyId && c.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) {
      return null;
    }
    return c;
  }

  public getComparisonsByRequirement(requirementId: string, companyId?: string): Comparison[] {
    this.ensureInit();
    return this.comparisons
      .filter((c) => {
        if (c.requirementId !== requirementId) return false;
        if (companyId && c.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public saveComparison(data: Omit<Comparison, 'id' | 'createdAt'>): string {
    this.ensureInit();
    const id = `comp-${Date.now()}`;
    const newComp: Comparison = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.comparisons.unshift(newComp);
    this.saveToStorage();
    return id;
  }
}

export const demoStore = new DemoStore();
