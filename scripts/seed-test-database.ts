/**
 * Test Database Seed Script
 *
 * Creates a comprehensive test database demonstrating all form builder features:
 * - All field types (string, number, boolean, date, email, url, array, object)
 * - Layout fields (section-header, description, divider, image, spacer)
 * - MongoDB data patterns (Attribute Pattern, Tags, References)
 * - Lookup/reference fields with cascading
 * - Computed fields with formulas
 * - Repeater fields for arrays
 * - Conditional logic (show/hide)
 * - Multi-page forms
 * - Form variables
 */

import { MongoClient, ObjectId } from 'mongodb';

const DATABASE_NAME = 'form_builder_test';

// ============================================
// Collection: departments
// Purpose: Lookup reference collection for cascading dropdowns
// ============================================
const departments = [
  {
    _id: new ObjectId(),
    code: 'ENG',
    name: 'Engineering',
    budget: 5000000,
    headCount: 150,
    location: 'Building A',
    active: true,
    createdAt: new Date('2020-01-15')
  },
  {
    _id: new ObjectId(),
    code: 'MKT',
    name: 'Marketing',
    budget: 2000000,
    headCount: 45,
    location: 'Building B',
    active: true,
    createdAt: new Date('2020-01-15')
  },
  {
    _id: new ObjectId(),
    code: 'HR',
    name: 'Human Resources',
    budget: 1500000,
    headCount: 25,
    location: 'Building A',
    active: true,
    createdAt: new Date('2020-02-01')
  },
  {
    _id: new ObjectId(),
    code: 'FIN',
    name: 'Finance',
    budget: 1800000,
    headCount: 30,
    location: 'Building C',
    active: true,
    createdAt: new Date('2020-01-15')
  },
  {
    _id: new ObjectId(),
    code: 'OPS',
    name: 'Operations',
    budget: 3500000,
    headCount: 80,
    location: 'Building D',
    active: false,
    createdAt: new Date('2020-03-01')
  }
];

// ============================================
// Collection: job_titles
// Purpose: Cascading lookup - filtered by department
// ============================================
const jobTitles = [
  // Engineering titles
  { _id: new ObjectId(), departmentCode: 'ENG', title: 'Software Engineer', level: 'IC', salaryMin: 80000, salaryMax: 150000 },
  { _id: new ObjectId(), departmentCode: 'ENG', title: 'Senior Software Engineer', level: 'Senior IC', salaryMin: 120000, salaryMax: 200000 },
  { _id: new ObjectId(), departmentCode: 'ENG', title: 'Engineering Manager', level: 'Manager', salaryMin: 150000, salaryMax: 250000 },
  { _id: new ObjectId(), departmentCode: 'ENG', title: 'DevOps Engineer', level: 'IC', salaryMin: 90000, salaryMax: 160000 },
  { _id: new ObjectId(), departmentCode: 'ENG', title: 'QA Engineer', level: 'IC', salaryMin: 70000, salaryMax: 120000 },
  // Marketing titles
  { _id: new ObjectId(), departmentCode: 'MKT', title: 'Marketing Coordinator', level: 'IC', salaryMin: 50000, salaryMax: 80000 },
  { _id: new ObjectId(), departmentCode: 'MKT', title: 'Marketing Manager', level: 'Manager', salaryMin: 90000, salaryMax: 150000 },
  { _id: new ObjectId(), departmentCode: 'MKT', title: 'Content Strategist', level: 'Senior IC', salaryMin: 70000, salaryMax: 110000 },
  // HR titles
  { _id: new ObjectId(), departmentCode: 'HR', title: 'HR Coordinator', level: 'IC', salaryMin: 45000, salaryMax: 70000 },
  { _id: new ObjectId(), departmentCode: 'HR', title: 'HR Business Partner', level: 'Senior IC', salaryMin: 80000, salaryMax: 130000 },
  { _id: new ObjectId(), departmentCode: 'HR', title: 'Recruiter', level: 'IC', salaryMin: 55000, salaryMax: 90000 },
  // Finance titles
  { _id: new ObjectId(), departmentCode: 'FIN', title: 'Financial Analyst', level: 'IC', salaryMin: 60000, salaryMax: 100000 },
  { _id: new ObjectId(), departmentCode: 'FIN', title: 'Senior Accountant', level: 'Senior IC', salaryMin: 75000, salaryMax: 120000 },
  { _id: new ObjectId(), departmentCode: 'FIN', title: 'Finance Director', level: 'Director', salaryMin: 150000, salaryMax: 250000 },
  // Operations titles
  { _id: new ObjectId(), departmentCode: 'OPS', title: 'Operations Analyst', level: 'IC', salaryMin: 55000, salaryMax: 85000 },
  { _id: new ObjectId(), departmentCode: 'OPS', title: 'Operations Manager', level: 'Manager', salaryMin: 90000, salaryMax: 140000 }
];

// ============================================
// Collection: employees
// Purpose: Complete employee record demonstrating all field types
// Features:
// - All basic types
// - Attribute Pattern (key-value metadata)
// - Tags pattern (skills)
// - Nested objects (address, emergency contact)
// - Repeater pattern (certifications, work history)
// - References (department, manager)
// - Computed fields (yearsOfService, totalCompensation)
// ============================================
const employees: Array<{
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  hireDate: Date;
  salary: number;
  isRemote: boolean;
  isFullTime: boolean;
  employeeId: string;
  departmentCode: string;
  jobTitle: string;
  managerId: ObjectId | null;
  address: { street: string; city: string; state: string; zipCode: string; country: string };
  emergencyContact: { name: string; relationship: string; phone: string; email: string };
  skills: string[];
  metadata: Array<{ key: string; value: string }>;
  workHistory: Array<{ company: string; title: string; startDate: Date; endDate: Date; description: string }>;
  certifications: Array<{ name: string; issuer: string; issueDate: Date; expirationDate: Date | null }>;
  enrolledInHealthcare: boolean;
  healthcarePlan: string | null;
  enrolledIn401k: boolean;
  contribution401k: number;
  bonus: number;
  stockOptions: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    _id: new ObjectId(),
    // Basic info - simple types
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@company.com',
    phone: '+1-555-0123',
    dateOfBirth: new Date('1988-03-15'),
    hireDate: new Date('2019-06-01'),
    salary: 145000,
    isRemote: true,
    isFullTime: true,
    employeeId: 'EMP-2019-001',

    // Reference fields
    departmentCode: 'ENG',
    jobTitle: 'Senior Software Engineer',
    managerId: null, // Will be set after creation

    // Nested object - Address
    address: {
      street: '123 Tech Lane',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },

    // Nested object - Emergency Contact
    emergencyContact: {
      name: 'Michael Chen',
      relationship: 'Spouse',
      phone: '+1-555-0124',
      email: 'michael.chen@email.com'
    },

    // Tags pattern - Skills
    skills: ['TypeScript', 'React', 'Node.js', 'MongoDB', 'GraphQL', 'AWS'],

    // Attribute Pattern - Custom metadata
    metadata: [
      { key: 'Preferred Communication', value: 'Slack' },
      { key: 'T-Shirt Size', value: 'Medium' },
      { key: 'Dietary Restrictions', value: 'Vegetarian' },
      { key: 'Parking Spot', value: 'A-23' }
    ],

    // Repeater - Work History
    workHistory: [
      {
        company: 'TechStartup Inc',
        title: 'Software Engineer',
        startDate: new Date('2015-08-01'),
        endDate: new Date('2019-05-31'),
        description: 'Full-stack development using React and Node.js'
      },
      {
        company: 'Freelance',
        title: 'Web Developer',
        startDate: new Date('2014-01-01'),
        endDate: new Date('2015-07-31'),
        description: 'Freelance web development projects'
      }
    ],

    // Repeater - Certifications
    certifications: [
      { name: 'AWS Solutions Architect', issuer: 'Amazon', issueDate: new Date('2021-03-15'), expirationDate: new Date('2024-03-15') },
      { name: 'MongoDB Developer', issuer: 'MongoDB', issueDate: new Date('2020-11-01'), expirationDate: null }
    ],

    // Benefits enrollment - conditional logic testing
    enrolledInHealthcare: true,
    healthcarePlan: 'Premium PPO',
    enrolledIn401k: true,
    contribution401k: 15,

    // For computed fields
    bonus: 20000,
    stockOptions: 5000,

    // Status
    status: 'active',
    createdAt: new Date('2019-06-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    _id: new ObjectId(),
    firstName: 'James',
    lastName: 'Rodriguez',
    email: 'james.rodriguez@company.com',
    phone: '+1-555-0125',
    dateOfBirth: new Date('1975-11-22'),
    hireDate: new Date('2015-02-15'),
    salary: 220000,
    isRemote: false,
    isFullTime: true,
    employeeId: 'EMP-2015-042',
    departmentCode: 'ENG',
    jobTitle: 'Engineering Manager',
    managerId: null,
    address: {
      street: '456 Manager Ave',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94107',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Maria Rodriguez',
      relationship: 'Spouse',
      phone: '+1-555-0126',
      email: 'maria.r@email.com'
    },
    skills: ['Leadership', 'Agile', 'System Design', 'Python', 'Java', 'Architecture'],
    metadata: [
      { key: 'Reports To', value: 'CTO' },
      { key: 'Team Size', value: '12' }
    ],
    workHistory: [
      {
        company: 'BigTech Corp',
        title: 'Senior Engineer',
        startDate: new Date('2010-06-01'),
        endDate: new Date('2015-02-01'),
        description: 'Led platform development team'
      }
    ],
    certifications: [
      { name: 'PMP', issuer: 'PMI', issueDate: new Date('2018-06-01'), expirationDate: new Date('2024-06-01') }
    ],
    enrolledInHealthcare: true,
    healthcarePlan: 'Premium PPO',
    enrolledIn401k: true,
    contribution401k: 20,
    bonus: 50000,
    stockOptions: 25000,
    status: 'active',
    createdAt: new Date('2015-02-15'),
    updatedAt: new Date('2024-01-10')
  },
  {
    _id: new ObjectId(),
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@company.com',
    phone: '+1-555-0127',
    dateOfBirth: new Date('1992-07-08'),
    hireDate: new Date('2022-01-10'),
    salary: 85000,
    isRemote: true,
    isFullTime: false,
    employeeId: 'EMP-2022-015',
    departmentCode: 'MKT',
    jobTitle: 'Content Strategist',
    managerId: null,
    address: {
      street: '789 Remote Way',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Robert Johnson',
      relationship: 'Father',
      phone: '+1-555-0128',
      email: 'robert.j@email.com'
    },
    skills: ['Content Strategy', 'SEO', 'Copywriting', 'Social Media', 'Analytics'],
    metadata: [
      { key: 'Work Schedule', value: 'Part-time - 30hrs/week' },
      { key: 'Time Zone', value: 'CST' }
    ],
    workHistory: [
      {
        company: 'Digital Agency',
        title: 'Content Writer',
        startDate: new Date('2018-09-01'),
        endDate: new Date('2021-12-31'),
        description: 'B2B content creation'
      }
    ],
    certifications: [
      { name: 'Google Analytics', issuer: 'Google', issueDate: new Date('2021-05-01'), expirationDate: null }
    ],
    enrolledInHealthcare: false,
    healthcarePlan: null,
    enrolledIn401k: true,
    contribution401k: 10,
    bonus: 5000,
    stockOptions: 0,
    status: 'active',
    createdAt: new Date('2022-01-10'),
    updatedAt: new Date('2024-01-12')
  }
];

// ============================================
// Collection: products
// Purpose: E-commerce product catalog
// Features:
// - Nested variants (array of objects)
// - Tags pattern (categories)
// - Attribute Pattern (specifications)
// - Computed fields (margin, discountedPrice)
// - Multi-page form structure
// ============================================
const products = [
  {
    _id: new ObjectId(),
    // Basic Info (Page 1)
    name: 'Professional Wireless Headphones',
    sku: 'WH-PRO-2024-BLK',
    description: 'High-fidelity wireless headphones with active noise cancellation and 40-hour battery life.',
    brand: 'AudioMax',
    manufacturer: 'AudioMax Technologies Ltd.',

    // Pricing (Page 2)
    basePrice: 349.99,
    cost: 150.00,
    currency: 'USD',
    taxable: true,
    taxRate: 8.25,
    discountPercent: 0,

    // Inventory (Page 3)
    inStock: true,
    stockQuantity: 250,
    lowStockThreshold: 25,
    warehouseLocation: 'Warehouse A - Shelf 12B',
    reorderPoint: 50,

    // Categories - Tags pattern
    categories: ['Electronics', 'Audio', 'Headphones', 'Wireless', 'Professional'],

    // Specifications - Attribute Pattern
    specifications: [
      { key: 'Driver Size', value: '40mm' },
      { key: 'Frequency Response', value: '20Hz - 40kHz' },
      { key: 'Battery Life', value: '40 hours' },
      { key: 'Bluetooth Version', value: '5.2' },
      { key: 'Weight', value: '280g' },
      { key: 'Noise Cancellation', value: 'Active (ANC)' }
    ],

    // Variants - Repeater pattern
    variants: [
      { color: 'Black', size: 'Standard', sku: 'WH-PRO-2024-BLK', additionalPrice: 0, stock: 100 },
      { color: 'Silver', size: 'Standard', sku: 'WH-PRO-2024-SLV', additionalPrice: 0, stock: 80 },
      { color: 'Rose Gold', size: 'Standard', sku: 'WH-PRO-2024-RG', additionalPrice: 20, stock: 70 }
    ],

    // Media
    images: [
      'https://example.com/images/wh-pro-main.jpg',
      'https://example.com/images/wh-pro-side.jpg',
      'https://example.com/images/wh-pro-case.jpg'
    ],

    // Publishing
    isPublished: true,
    publishedAt: new Date('2024-01-01'),
    isFeatured: true,

    // Metadata
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-10')
  },
  {
    _id: new ObjectId(),
    name: 'Ergonomic Office Chair',
    sku: 'CH-ERG-2024-GRY',
    description: 'Premium ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back.',
    brand: 'ComfortWork',
    manufacturer: 'Office Furniture Co.',

    basePrice: 599.99,
    cost: 280.00,
    currency: 'USD',
    taxable: true,
    taxRate: 8.25,
    discountPercent: 15,

    inStock: true,
    stockQuantity: 45,
    lowStockThreshold: 10,
    warehouseLocation: 'Warehouse B - Section 4',
    reorderPoint: 20,

    categories: ['Furniture', 'Office', 'Chairs', 'Ergonomic'],

    specifications: [
      { key: 'Material', value: 'Mesh + Aluminum' },
      { key: 'Max Weight Capacity', value: '300 lbs' },
      { key: 'Seat Height Range', value: '17" - 21"' },
      { key: 'Warranty', value: '10 years' },
      { key: 'Assembly Required', value: 'Yes' }
    ],

    variants: [
      { color: 'Gray', size: 'Standard', sku: 'CH-ERG-2024-GRY', additionalPrice: 0, stock: 20 },
      { color: 'Black', size: 'Standard', sku: 'CH-ERG-2024-BLK', additionalPrice: 0, stock: 15 },
      { color: 'Gray', size: 'Large', sku: 'CH-ERG-2024-GRY-L', additionalPrice: 100, stock: 10 }
    ],

    images: [
      'https://example.com/images/chair-main.jpg',
      'https://example.com/images/chair-detail.jpg'
    ],

    isPublished: true,
    publishedAt: new Date('2024-01-05'),
    isFeatured: false,

    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-08')
  }
];

// ============================================
// Collection: orders
// Purpose: E-commerce orders
// Features:
// - Reference to customer
// - Nested line items (repeater)
// - Computed fields (subtotal, tax, total)
// - Status workflow
// - Address objects
// ============================================
const orders = [
  {
    _id: new ObjectId(),
    orderNumber: 'ORD-2024-0001',

    // Customer Info
    customer: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0200'
    },

    // Addresses
    shippingAddress: {
      street: '100 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    billingAddress: {
      street: '100 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    sameAsShipping: true,

    // Line Items - Repeater
    items: [
      {
        productSku: 'WH-PRO-2024-BLK',
        productName: 'Professional Wireless Headphones',
        quantity: 1,
        unitPrice: 349.99,
        discount: 0
      },
      {
        productSku: 'CH-ERG-2024-GRY',
        productName: 'Ergonomic Office Chair',
        quantity: 1,
        unitPrice: 509.99,
        discount: 90.00
      }
    ],

    // Pricing (computed in form)
    subtotal: 769.98,
    taxRate: 8.25,
    taxAmount: 63.52,
    shippingCost: 0,
    total: 833.50,

    // Payment
    paymentMethod: 'Credit Card',
    paymentStatus: 'paid',
    paidAt: new Date('2024-01-15T10:30:00Z'),

    // Order Status
    status: 'shipped',
    statusHistory: [
      { status: 'pending', timestamp: new Date('2024-01-15T10:30:00Z'), note: 'Order placed' },
      { status: 'confirmed', timestamp: new Date('2024-01-15T10:35:00Z'), note: 'Payment confirmed' },
      { status: 'processing', timestamp: new Date('2024-01-16T09:00:00Z'), note: 'Started processing' },
      { status: 'shipped', timestamp: new Date('2024-01-17T14:20:00Z'), note: 'Shipped via FedEx' }
    ],

    // Shipping
    shippingMethod: 'FedEx Ground',
    trackingNumber: 'FX-123456789',
    estimatedDelivery: new Date('2024-01-22'),

    // Notes
    customerNotes: 'Please leave at front door',
    internalNotes: 'VIP customer - priority shipping',

    // Timestamps
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-17T14:20:00Z')
  }
];

// ============================================
// Collection: support_tickets
// Purpose: Customer support tickets
// Features:
// - Conditional fields (urgency details only if urgent)
// - Reference to customer
// - Comments array (repeater)
// - Tags for categorization
// - Multi-select (affected products)
// ============================================
const supportTickets = [
  {
    _id: new ObjectId(),
    ticketNumber: 'TKT-2024-0001',

    // Reporter Info
    reporterName: 'Alice Brown',
    reporterEmail: 'alice.brown@email.com',
    reporterPhone: '+1-555-0300',
    isExistingCustomer: true,
    customerId: 'CUST-12345',

    // Ticket Details
    subject: 'Headphones not connecting via Bluetooth',
    description: 'My Professional Wireless Headphones (purchased last week) are not connecting to my MacBook. I\'ve tried resetting them multiple times.',
    category: 'Technical Support',
    subcategory: 'Connectivity Issues',

    // Priority & Urgency
    priority: 'high',
    isUrgent: true,
    urgencyReason: 'Customer needs headphones for important meeting tomorrow',
    expectedResolutionDate: new Date('2024-01-16'),

    // Affected Products - Multi-select reference
    affectedProducts: ['WH-PRO-2024-BLK'],

    // Tags
    tags: ['bluetooth', 'connectivity', 'headphones', 'macbook'],

    // Assignment
    assignedTo: 'Support Team',
    assignedAgent: 'tech-support@company.com',

    // Status
    status: 'in-progress',
    resolution: null,

    // Comments/Activity - Repeater
    comments: [
      {
        author: 'Support Bot',
        authorType: 'system',
        content: 'Ticket created and assigned to Technical Support team.',
        timestamp: new Date('2024-01-15T11:00:00Z'),
        isInternal: false
      },
      {
        author: 'Mike Support',
        authorType: 'agent',
        content: 'Hi Alice, I\'m sorry to hear about the Bluetooth issue. Can you confirm the firmware version of your headphones? You can find this in the AudioMax app.',
        timestamp: new Date('2024-01-15T11:30:00Z'),
        isInternal: false
      },
      {
        author: 'Alice Brown',
        authorType: 'customer',
        content: 'The app shows firmware version 2.1.0',
        timestamp: new Date('2024-01-15T12:15:00Z'),
        isInternal: false
      }
    ],

    // Attachments
    attachments: [
      { name: 'screenshot.png', url: 'https://example.com/attachments/screenshot.png', type: 'image/png' }
    ],

    // SLA
    slaDeadline: new Date('2024-01-16T11:00:00Z'),
    slaBreached: false,

    // Timestamps
    createdAt: new Date('2024-01-15T11:00:00Z'),
    updatedAt: new Date('2024-01-15T12:15:00Z'),
    firstResponseAt: new Date('2024-01-15T11:30:00Z')
  }
];

// ============================================
// Collection: projects
// Purpose: Project management
// Features:
// - Reference to team members (multi-select)
// - Milestones (repeater)
// - Tasks (nested repeater)
// - Budget tracking (computed)
// - Gantt-style dates
// ============================================
const projects = [
  {
    _id: new ObjectId(),
    projectCode: 'PROJ-2024-001',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with improved UX and mobile responsiveness.',

    // Client
    clientName: 'Internal',
    clientContact: 'marketing@company.com',

    // Status
    status: 'in-progress',
    phase: 'Development',
    percentComplete: 65,

    // Team - References to employees
    projectManager: 'james.rodriguez@company.com',
    teamMembers: [
      { email: 'sarah.chen@company.com', role: 'Lead Developer' },
      { email: 'emily.johnson@company.com', role: 'Content' }
    ],
    departmentCode: 'ENG',

    // Timeline
    startDate: new Date('2024-01-02'),
    targetEndDate: new Date('2024-03-31'),
    actualEndDate: null,

    // Budget
    budgetAmount: 150000,
    budgetSpent: 85000,
    budgetRemaining: 65000, // Computed

    // Milestones - Repeater
    milestones: [
      {
        name: 'Discovery & Planning',
        description: 'Requirements gathering and project planning',
        dueDate: new Date('2024-01-15'),
        completedDate: new Date('2024-01-14'),
        status: 'completed'
      },
      {
        name: 'Design Phase',
        description: 'UI/UX design and prototyping',
        dueDate: new Date('2024-02-01'),
        completedDate: new Date('2024-02-02'),
        status: 'completed'
      },
      {
        name: 'Development Phase',
        description: 'Frontend and backend development',
        dueDate: new Date('2024-03-01'),
        completedDate: null,
        status: 'in-progress'
      },
      {
        name: 'Testing & Launch',
        description: 'QA testing and production deployment',
        dueDate: new Date('2024-03-31'),
        completedDate: null,
        status: 'pending'
      }
    ],

    // Risks - Attribute pattern
    risks: [
      { key: 'Scope Creep', value: 'Medium' },
      { key: 'Resource Availability', value: 'Low' },
      { key: 'Technical Complexity', value: 'High' }
    ],

    // Tags
    tags: ['web', 'redesign', 'internal', 'high-priority'],

    // Documents
    documents: [
      { name: 'Requirements.pdf', url: 'https://example.com/docs/req.pdf' },
      { name: 'Design Mockups.fig', url: 'https://example.com/docs/design.fig' }
    ],

    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-20')
  }
];

// ============================================
// Collection: events
// Purpose: Event registration form
// Features:
// - Multi-page form (Event Details, Attendee Info, Preferences)
// - Conditional sections (dietary restrictions if has restrictions)
// - Multiple registrants (repeater)
// - Session selection (multi-select)
// ============================================
const events = [
  {
    _id: new ObjectId(),
    eventCode: 'CONF-2024-TECH',
    name: 'TechConnect 2024',
    description: 'Annual technology conference featuring workshops, keynotes, and networking opportunities.',

    // Event Details
    eventType: 'Conference',
    venue: 'Convention Center',
    address: {
      street: '500 Convention Way',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      country: 'USA'
    },

    // Dates
    startDate: new Date('2024-06-15T09:00:00Z'),
    endDate: new Date('2024-06-17T18:00:00Z'),
    registrationDeadline: new Date('2024-06-01'),

    // Capacity
    maxAttendees: 500,
    currentRegistrations: 342,
    spotsRemaining: 158, // Computed

    // Pricing
    ticketTypes: [
      { type: 'Early Bird', price: 299, available: false, deadline: new Date('2024-04-01') },
      { type: 'Regular', price: 399, available: true, deadline: new Date('2024-05-31') },
      { type: 'VIP', price: 699, available: true, deadline: new Date('2024-06-01') }
    ],

    // Sessions
    sessions: [
      { id: 'SESS-001', title: 'Keynote: Future of AI', speaker: 'Dr. Jane Smith', time: '2024-06-15T09:00:00Z', track: 'Main Stage' },
      { id: 'SESS-002', title: 'Workshop: Building with MongoDB', speaker: 'John Developer', time: '2024-06-15T11:00:00Z', track: 'Workshop A' },
      { id: 'SESS-003', title: 'Panel: DevOps Best Practices', speaker: 'Various', time: '2024-06-15T14:00:00Z', track: 'Track B' },
      { id: 'SESS-004', title: 'Networking Lunch', speaker: null, time: '2024-06-15T12:00:00Z', track: 'Dining Hall' }
    ],

    // Status
    status: 'open',
    isPublished: true,

    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20')
  }
];

// ============================================
// Collection: event_registrations
// Purpose: Event registration submissions
// Features:
// - Multi-page form submission
// - Multiple attendees (repeater)
// - Session selection (multi-select with references)
// - Conditional dietary restrictions
// ============================================
const eventRegistrations = [
  {
    _id: new ObjectId(),
    eventId: 'CONF-2024-TECH',
    registrationNumber: 'REG-2024-0001',

    // Primary Contact (Page 1)
    primaryContact: {
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@techcorp.com',
      phone: '+1-555-0400',
      company: 'TechCorp Industries',
      jobTitle: 'CTO'
    },

    // Attendees (Page 2) - Repeater
    attendees: [
      {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@techcorp.com',
        ticketType: 'VIP',
        hasDietaryRestrictions: true,
        dietaryRestrictions: ['Vegetarian', 'Gluten-Free'],
        accessibilityNeeds: null
      },
      {
        firstName: 'Lisa',
        lastName: 'Wang',
        email: 'lisa.wang@techcorp.com',
        ticketType: 'Regular',
        hasDietaryRestrictions: false,
        dietaryRestrictions: [],
        accessibilityNeeds: null
      }
    ],

    // Session Selection (Page 3) - Multi-select references
    selectedSessions: ['SESS-001', 'SESS-002', 'SESS-004'],

    // Preferences (Page 4)
    tshirtSizes: [
      { attendeeEmail: 'david.wilson@techcorp.com', size: 'Large' },
      { attendeeEmail: 'lisa.wang@techcorp.com', size: 'Medium' }
    ],

    // Additional options - Conditional
    hotelBookingRequested: true,
    hotelCheckIn: new Date('2024-06-14'),
    hotelCheckOut: new Date('2024-06-18'),
    hotelRoomType: 'Double',

    parkingRequired: true,
    parkingDays: ['2024-06-15', '2024-06-16', '2024-06-17'],

    // Payment Summary (computed)
    numberOfAttendees: 2,
    ticketSubtotal: 1098, // 699 VIP + 399 Regular
    hotelCost: 800,
    parkingCost: 75,
    totalAmount: 1973,

    // Payment
    paymentMethod: 'Credit Card',
    paymentStatus: 'paid',
    invoiceNumber: 'INV-2024-0001',

    // Notes
    specialRequests: 'Please seat our group together at the keynote.',

    // Status
    status: 'confirmed',
    confirmationSentAt: new Date('2024-02-01T10:00:00Z'),

    createdAt: new Date('2024-02-01T09:45:00Z'),
    updatedAt: new Date('2024-02-01T10:00:00Z')
  }
];

// ============================================
// Collection: surveys
// Purpose: Survey/feedback forms
// Features:
// - Rating fields (1-5, 1-10)
// - Multiple choice
// - Open-ended text
// - Matrix questions (multiple ratings)
// - Conditional follow-up questions
// ============================================
const surveys = [
  {
    _id: new ObjectId(),
    surveyCode: 'SURV-2024-CSAT',
    title: 'Customer Satisfaction Survey',
    description: 'Help us improve by sharing your experience',

    // Survey Structure
    sections: [
      {
        title: 'Overall Experience',
        description: 'Tell us about your overall experience',
        questions: [
          { id: 'q1', type: 'rating', label: 'How satisfied are you with our product?', scale: 10 },
          { id: 'q2', type: 'rating', label: 'How likely are you to recommend us?', scale: 10 },
          { id: 'q3', type: 'multiple-choice', label: 'How did you hear about us?', options: ['Google', 'Social Media', 'Friend', 'Advertisement', 'Other'] }
        ]
      },
      {
        title: 'Product Feedback',
        description: 'Specific feedback about the product',
        questions: [
          { id: 'q4', type: 'matrix', label: 'Rate the following aspects', rows: ['Ease of use', 'Features', 'Performance', 'Value for money'], scale: 5 },
          { id: 'q5', type: 'text', label: 'What features would you like to see added?' }
        ]
      }
    ],

    // Status
    isActive: true,
    responsesCount: 156,
    averageRating: 8.2,

    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20')
  }
];

// ============================================
// Main Seed Function
// ============================================
async function seedDatabase(connectionString: string) {
  const client = new MongoClient(connectionString);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DATABASE_NAME);

    // Drop existing collections
    const collections = ['departments', 'job_titles', 'employees', 'products', 'orders', 'support_tickets', 'projects', 'events', 'event_registrations', 'surveys'];

    for (const collName of collections) {
      try {
        await db.collection(collName).drop();
        console.log(`Dropped collection: ${collName}`);
      } catch (e) {
        // Collection might not exist
      }
    }

    // Insert data
    console.log('\nSeeding collections...\n');

    await db.collection('departments').insertMany(departments);
    console.log(`✓ departments: ${departments.length} documents`);

    await db.collection('job_titles').insertMany(jobTitles);
    console.log(`✓ job_titles: ${jobTitles.length} documents`);

    // Set manager references
    const james = await db.collection('employees').findOne({ firstName: 'James' });
    if (james) {
      employees[0].managerId = james._id;
      employees[2].managerId = james._id;
    }

    await db.collection('employees').insertMany(employees);
    console.log(`✓ employees: ${employees.length} documents`);

    await db.collection('products').insertMany(products);
    console.log(`✓ products: ${products.length} documents`);

    await db.collection('orders').insertMany(orders);
    console.log(`✓ orders: ${orders.length} documents`);

    await db.collection('support_tickets').insertMany(supportTickets);
    console.log(`✓ support_tickets: ${supportTickets.length} documents`);

    await db.collection('projects').insertMany(projects);
    console.log(`✓ projects: ${projects.length} documents`);

    await db.collection('events').insertMany(events);
    console.log(`✓ events: ${events.length} documents`);

    await db.collection('event_registrations').insertMany(eventRegistrations);
    console.log(`✓ event_registrations: ${eventRegistrations.length} documents`);

    await db.collection('surveys').insertMany(surveys);
    console.log(`✓ surveys: ${surveys.length} documents`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`\nDatabase: ${DATABASE_NAME}`);
    console.log('Collections created:');
    collections.forEach(c => console.log(`  - ${c}`));

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Export for use as module
export { seedDatabase, DATABASE_NAME };

// Run if executed directly
async function main() {
  // Try to load from .env.local
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.local' });
  } catch {
    // dotenv not available, continue with env vars
  }

  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    console.error('\n❌ MONGODB_URI environment variable is not set.\n');
    console.log('To run this script, either:');
    console.log('  1. Set MONGODB_URI in your .env.local file');
    console.log('  2. Or run with: MONGODB_URI="mongodb+srv://..." npx ts-node scripts/seed-test-database.ts\n');
    process.exit(1);
  }

  console.log('🌱 Starting database seeding...');
  console.log(`📦 Target database: ${DATABASE_NAME}\n`);

  await seedDatabase(connectionString);
}

main().catch((error) => {
  console.error('Failed to seed database:', error.message);
  process.exit(1);
});
