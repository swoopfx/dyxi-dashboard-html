import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface InvoiceAddon {
  id: string;
  name: string;
  priceUsd: number;
  description: string;
}

export interface InvoiceDiscount {
  code: string;
  label: string;
  amountUsd: number;
}

export interface Invoice {
  id: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'VOID';
  createdAt: string;
  dueDate: string;
  settledAt?: string;
  payerName: string;
  patientName: string;
  email: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  basePriceUsd: number;
  addons: InvoiceAddon[];
  discount?: InvoiceDiscount;
  totalUsd: number;
  notes?: string;
  transactionId?: string;
  settledCurrency?: string;
  settledAmount?: number;
  methodMask?: string;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  timestamp: string;
  payerName: string;
  patientName: string;
  email: string;
  serviceName: string;
  serviceCode: string;
  basePrice: number;
  addons: InvoiceAddon[];
  discountCode?: string;
  discountAmount: number;
  totalPaid: number;
  currency: string;
  method: string;
  methodMask: string;
  authCode: string;
  status: 'SETTLED';
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'ach' | 'wallet';
  brand: string;
  last4: string;
  expiry: string;
  cardholder: string;
  isDefault: boolean;
  currency: string;
}

export interface PortalStateData {
  invoices: Invoice[];
  transactions: Transaction[];
  savedMethods: SavedPaymentMethod[];
  meta: {
    clinicNpi: string;
    clinicName: string;
    lastUpdated: string;
  };
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'payment-portal-db.json');

const INITIAL_SEED: PortalStateData = {
  invoices: [
    {
      id: 'NP-INV-8921',
      status: 'PENDING',
      createdAt: '2026-10-18T10:30:00.000Z',
      dueDate: '2026-10-28T23:59:59.000Z',
      payerName: 'Sarah Jenkins',
      patientName: 'Leo Jenkins',
      email: 'sarah.jenkins@example.com',
      serviceId: 'kabc',
      serviceName: 'Kaufman Assessment Battery for Children (K-ABC-II)',
      serviceCode: 'CPT-96130',
      basePriceUsd: 480,
      addons: [
        {
          id: 'expedited',
          name: 'Priority 48-Hour Report Delivery',
          priceUsd: 75,
          description: 'Expedited diagnostic synthesis and clinician sign-off within 2 business days'
        }
      ],
      totalUsd: 555,
      notes: 'Diagnostic cognitive battery scheduled for quarterly neurodivergence follow-up.'
    },
    {
      id: 'NP-INV-4410',
      status: 'PENDING',
      createdAt: '2026-10-19T14:15:00.000Z',
      dueDate: '2026-11-04T23:59:59.000Z',
      payerName: 'Sarah Jenkins',
      patientName: 'Leo Jenkins',
      email: 'sarah.jenkins@example.com',
      serviceId: 'attention',
      serviceName: 'Comprehensive Attention Span & Focus Diagnostic Analysis',
      serviceCode: 'CPT-96136',
      basePriceUsd: 340,
      addons: [],
      totalUsd: 340,
      notes: 'Continuous Performance Test & executive inhibition evaluation.'
    },
    {
      id: 'NP-INV-7102',
      status: 'PAID',
      createdAt: '2026-10-10T09:00:00.000Z',
      dueDate: '2026-10-20T23:59:59.000Z',
      settledAt: '2026-10-12T11:42:18.000Z',
      payerName: 'Sarah Jenkins',
      patientName: 'Leo Jenkins',
      email: 'sarah.jenkins@example.com',
      serviceId: 'ctopp',
      serviceName: 'CTOPP-2 Phonological & Rapid Naming Protocol',
      serviceCode: 'CPT-96132',
      basePriceUsd: 420,
      addons: [
        {
          id: 'school_pack',
          name: 'Official School IEP Accommodation Addendum',
          priceUsd: 95,
          description: 'Certified clinical accommodation report for 504 Plan / IEP review meetings'
        }
      ],
      totalUsd: 515,
      transactionId: 'TXN-NP-98214902',
      settledCurrency: 'USD',
      settledAmount: 515,
      methodMask: 'VISA •••• 4242'
    },
    {
      id: 'NP-INV-3091',
      status: 'PAID',
      createdAt: '2026-09-18T16:20:00.000Z',
      dueDate: '2026-09-28T23:59:59.000Z',
      settledAt: '2026-09-20T17:05:44.000Z',
      payerName: 'Dr. Rajesh Patel',
      patientName: 'Maya Patel',
      email: 'rajesh.patel@example.com',
      serviceId: 'dyscalculia',
      serviceName: 'Clinical Dyscalculia & Numerical Processing Battery',
      serviceCode: 'CPT-96134',
      basePriceUsd: 390,
      addons: [],
      totalUsd: 390,
      transactionId: 'TXN-NP-67120482',
      settledCurrency: 'USD',
      settledAmount: 390,
      methodMask: 'MASTERCARD •••• 8812'
    }
  ],
  transactions: [
    {
      id: 'TXN-NP-98214902',
      invoiceId: 'NP-INV-7102',
      timestamp: '2026-10-12 11:42:18 UTC',
      payerName: 'Sarah Jenkins',
      patientName: 'Leo Jenkins',
      email: 'sarah.jenkins@example.com',
      serviceName: 'CTOPP-2 Phonological & Rapid Naming Protocol',
      serviceCode: 'CPT-96132',
      basePrice: 420,
      addons: [
        {
          id: 'school_pack',
          name: 'Official School IEP Accommodation Addendum',
          priceUsd: 95,
          description: 'Certified clinical accommodation report for 504 Plan / IEP review meetings'
        }
      ],
      discountAmount: 0,
      totalPaid: 515,
      currency: 'USD',
      method: 'card',
      methodMask: 'VISA •••• 4242',
      authCode: 'AUTH-NP-892341',
      status: 'SETTLED'
    },
    {
      id: 'TXN-NP-67120482',
      invoiceId: 'NP-INV-3091',
      timestamp: '2026-09-20 17:05:44 UTC',
      payerName: 'Dr. Rajesh Patel',
      patientName: 'Maya Patel',
      email: 'rajesh.patel@example.com',
      serviceName: 'Clinical Dyscalculia & Numerical Processing Battery',
      serviceCode: 'CPT-96134',
      basePrice: 390,
      addons: [],
      discountAmount: 0,
      totalPaid: 390,
      currency: 'USD',
      method: 'card',
      methodMask: 'MASTERCARD •••• 8812',
      authCode: 'AUTH-NP-452109',
      status: 'SETTLED'
    }
  ],
  savedMethods: [
    {
      id: 'meth_1',
      type: 'card',
      brand: 'VISA',
      last4: '4242',
      expiry: '12/27',
      cardholder: 'Sarah Jenkins',
      isDefault: true,
      currency: 'USD'
    },
    {
      id: 'meth_2',
      type: 'card',
      brand: 'VERVE',
      last4: '4901',
      expiry: '06/28',
      cardholder: 'Sarah Jenkins',
      isDefault: false,
      currency: 'NGN'
    },
    {
      id: 'meth_3',
      type: 'ach',
      brand: 'ZENITH BANK',
      last4: '4012',
      expiry: 'N/A',
      cardholder: 'Sarah Jenkins',
      isDefault: false,
      currency: 'NGN'
    }
  ],
  meta: {
    clinicNpi: '#1942801928',
    clinicName: 'NeuroPath Diagnostic Clinic',
    lastUpdated: new Date().toISOString()
  }
};

class PortalStore {
  private data: PortalStateData;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data dir:', err);
      }
    }
  }

  private loadFromDisk(): PortalStateData {
    this.ensureDir();
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.invoices && parsed.transactions) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to read db file, initializing initial seed:', err);
    }

    // Initialize seed and write
    this.saveToDisk(INITIAL_SEED);
    return JSON.parse(JSON.stringify(INITIAL_SEED));
  }

  private saveToDisk(data: PortalStateData) {
    this.ensureDir();
    try {
      data.meta.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public getState(): PortalStateData {
    return this.data;
  }

  public getInvoice(id: string): Invoice | undefined {
    return this.data.invoices.find(inv => inv.id.toLowerCase() === id.toLowerCase());
  }

  public createInvoice(invoiceData: Partial<Invoice>): Invoice {
    const id = invoiceData.id || `NP-INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const newInvoice: Invoice = {
      id,
      status: 'PENDING',
      createdAt: now.toISOString(),
      dueDate: invoiceData.dueDate || dueDate.toISOString(),
      payerName: invoiceData.payerName || 'Sarah Jenkins',
      patientName: invoiceData.patientName || 'Leo Jenkins',
      email: invoiceData.email || 'sarah.jenkins@example.com',
      serviceId: invoiceData.serviceId || 'custom',
      serviceName: invoiceData.serviceName || 'Custom Clinical Diagnostic Invoice',
      serviceCode: invoiceData.serviceCode || 'CPT-96130',
      basePriceUsd: invoiceData.basePriceUsd || 250,
      addons: invoiceData.addons || [],
      discount: invoiceData.discount,
      totalUsd: invoiceData.totalUsd || 250,
      notes: invoiceData.notes || 'Created via NeuroPath Payment Portal'
    };

    this.data.invoices.unshift(newInvoice);
    this.saveToDisk(this.data);
    return newInvoice;
  }

  public processPayment(paymentPayload: {
    invoiceId?: string;
    serviceId?: string;
    serviceName: string;
    serviceCode: string;
    basePrice: number;
    addons?: InvoiceAddon[];
    discountCode?: string;
    discountAmount?: number;
    totalPaid: number;
    currency: string;
    exchangeRate?: number;
    payerName: string;
    patientName: string;
    email: string;
    method: string;
    methodMask: string;
    saveMethod?: boolean;
    savedCardData?: Partial<SavedPaymentMethod>;
  }): { transaction: Transaction; invoice: Invoice } {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const transactionId = `TXN-NP-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const authCode = `AUTH-NP-${Math.floor(100000 + Math.random() * 900000)}`;

    let targetInvoice: Invoice | undefined;

    if (paymentPayload.invoiceId) {
      targetInvoice = this.data.invoices.find(i => i.id === paymentPayload.invoiceId);
    }

    if (!targetInvoice) {
      // Create new invoice for ad-hoc checkout
      targetInvoice = this.createInvoice({
        id: paymentPayload.invoiceId || `NP-INV-${Math.floor(1000 + Math.random() * 9000)}`,
        payerName: paymentPayload.payerName,
        patientName: paymentPayload.patientName,
        email: paymentPayload.email,
        serviceId: paymentPayload.serviceId || 'adhoc',
        serviceName: paymentPayload.serviceName,
        serviceCode: paymentPayload.serviceCode,
        basePriceUsd: paymentPayload.basePrice,
        addons: paymentPayload.addons || [],
        totalUsd: paymentPayload.basePrice + (paymentPayload.addons || []).reduce((s, a) => s + a.priceUsd, 0) - (paymentPayload.discountAmount || 0)
      });
    }

    // Mark invoice as PAID
    targetInvoice.status = 'PAID';
    targetInvoice.settledAt = now.toISOString();
    targetInvoice.transactionId = transactionId;
    targetInvoice.settledCurrency = paymentPayload.currency;
    targetInvoice.settledAmount = paymentPayload.totalPaid;
    targetInvoice.methodMask = paymentPayload.methodMask;

    // Create transaction record
    const transaction: Transaction = {
      id: transactionId,
      invoiceId: targetInvoice.id,
      timestamp: dateStr,
      payerName: paymentPayload.payerName,
      patientName: paymentPayload.patientName,
      email: paymentPayload.email,
      serviceName: paymentPayload.serviceName,
      serviceCode: paymentPayload.serviceCode,
      basePrice: paymentPayload.basePrice,
      addons: paymentPayload.addons || [],
      discountCode: paymentPayload.discountCode,
      discountAmount: paymentPayload.discountAmount || 0,
      totalPaid: paymentPayload.totalPaid,
      currency: paymentPayload.currency,
      method: paymentPayload.method,
      methodMask: paymentPayload.methodMask,
      authCode,
      status: 'SETTLED'
    };

    this.data.transactions.unshift(transaction);

    // Save payment method if requested
    if (paymentPayload.saveMethod && paymentPayload.savedCardData) {
      const existing = this.data.savedMethods.find(
        m => m.last4 === paymentPayload.savedCardData?.last4 && m.brand === paymentPayload.savedCardData?.brand
      );
      if (!existing && paymentPayload.savedCardData.last4) {
        this.data.savedMethods.push({
          id: `meth_${Date.now()}`,
          type: (paymentPayload.savedCardData.type as any) || 'card',
          brand: paymentPayload.savedCardData.brand || 'CARD',
          last4: paymentPayload.savedCardData.last4,
          expiry: paymentPayload.savedCardData.expiry || '12/28',
          cardholder: paymentPayload.payerName,
          isDefault: false,
          currency: paymentPayload.currency
        });
      }
    }

    this.saveToDisk(this.data);
    return { transaction, invoice: targetInvoice };
  }

  public addSavedMethod(method: SavedPaymentMethod): SavedPaymentMethod {
    this.data.savedMethods.push(method);
    this.saveToDisk(this.data);
    return method;
  }

  public removeSavedMethod(id: string): boolean {
    const prevLen = this.data.savedMethods.length;
    this.data.savedMethods = this.data.savedMethods.filter(m => m.id !== id);
    if (this.data.savedMethods.length !== prevLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  public resetDemo(): PortalStateData {
    this.data = JSON.parse(JSON.stringify(INITIAL_SEED));
    this.saveToDisk(this.data);
    return this.data;
  }
}

export const portalStore = new PortalStore();
