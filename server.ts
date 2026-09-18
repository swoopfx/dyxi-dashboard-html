import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { portalStore } from './portal-store.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API ROUTES: Stateful Payment Portal & Ledger
app.get('/api/portal/state', (req, res) => {
  try {
    const state = portalStore.getState();
    res.json({ success: true, ...state });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/portal/invoice/:id', (req, res) => {
  const inv = portalStore.getInvoice(req.params.id);
  if (!inv) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }
  res.json({ success: true, invoice: inv });
});

app.post('/api/portal/pay', (req, res) => {
  try {
    const {
      invoiceId,
      serviceId,
      serviceName,
      serviceCode,
      basePrice,
      addons,
      discountCode,
      discountAmount,
      totalPaid,
      currency,
      exchangeRate,
      payerName,
      patientName,
      email,
      method,
      methodMask,
      saveMethod,
      savedCardData
    } = req.body;

    if (!payerName || !patientName || !email || !totalPaid) {
      return res.status(400).json({ success: false, error: 'Missing required payment fields' });
    }

    const result = portalStore.processPayment({
      invoiceId,
      serviceId,
      serviceName: serviceName || 'Clinical Diagnostic Service',
      serviceCode: serviceCode || 'CPT-96130',
      basePrice: Number(basePrice) || 0,
      addons: addons || [],
      discountCode,
      discountAmount: Number(discountAmount) || 0,
      totalPaid: Number(totalPaid),
      currency: currency || 'USD',
      exchangeRate: Number(exchangeRate) || 1.0,
      payerName,
      patientName,
      email,
      method: method || 'card',
      methodMask: methodMask || 'VISA •••• 4242',
      saveMethod: Boolean(saveMethod),
      savedCardData
    });

    res.json({
      success: true,
      message: 'Payment processed and invoice settled successfully',
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/portal/invoices', (req, res) => {
  try {
    const invoice = portalStore.createInvoice(req.body);
    res.json({ success: true, invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/portal/saved-methods', (req, res) => {
  try {
    const method = portalStore.addSavedMethod(req.body);
    res.json({ success: true, method });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/portal/saved-methods/:id', (req, res) => {
  try {
    const deleted = portalStore.removeSavedMethod(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/portal/reset', (req, res) => {
  try {
    const fresh = portalStore.resetDemo();
    res.json({ success: true, ...fresh });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API ROUTE: Stateless Payment Session Initialization
app.get('/api/stateless/init', (req, res) => {
  try {
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const sessionRef = `NP-SESS-2026-${randomHex}`;
    const invoiceRef = `NP-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    res.json({
      success: true,
      sessionId: sessionRef,
      sessionInvoiceId: invoiceRef,
      merchant: {
        name: "NeuroPath Clinic",
        npi: "1942801928",
        taxId: "82-1928401",
        irsCode: "213(d) Health Care Qualified",
        pciDssCompliance: "Level 1 Tokenized Gateway Active"
      },
      catalog: [
        {
          id: "dyslexia",
          name: "Comprehensive Dyslexia Diagnostic Battery",
          code: "CPT-96130",
          priceUsd: 850,
          description: "Full formal neurodiversity assessment with phonological processing and comprehensive written psychometric report."
        },
        {
          id: "kabc",
          name: "Kaufman Assessment Battery (KABC-II)",
          code: "CPT-96136",
          priceUsd: 620,
          description: "Standardized cognitive processing and working memory evaluation."
        },
        {
          id: "adhd",
          name: "ADHD & Executive Functioning Clinical Profiling",
          code: "CPT-96132",
          priceUsd: 490,
          description: "Continuous performance analysis, impulse regulation, and executive attention metrics."
        },
        {
          id: "wiat",
          name: "WIAT-4 Academic Achievement Battery",
          code: "CPT-96130-AC",
          priceUsd: 540,
          description: "Objective measurement of reading decoding, reading comprehension, and numerical reasoning."
        },
        {
          id: "ctopp",
          name: "CTOPP-2 Comprehensive Phonological Battery",
          code: "CPT-96131",
          priceUsd: 380,
          description: "Detailed analysis of phonological awareness, phonological memory, and rapid naming."
        },
        {
          id: "therapy",
          name: "Specialized 1-on-1 Neurodevelopmental Therapy (5 Sessions)",
          code: "CPT-97153",
          priceUsd: 750,
          description: "Direct clinical therapy block with licensed dyslexia and cognitive speech specialists."
        }
      ],
      addons: [
        { id: "expedited", name: "Expedited 48-Hour Clinical Report Delivery", priceUsd: 120 },
        { id: "school_advocacy", name: "School District IEP / 504 Plan Clinical Consultation", priceUsd: 180 },
        { id: "telehealth_recording", name: "Digital HD Video Recording & Clinician Debrief Audio", priceUsd: 45 }
      ],
      exchangeRates: {
        USD: { symbol: '$', rate: 1.0, name: 'US Dollar', code: 'USD' },
        NGN: { symbol: '₦', rate: 1540.0, name: 'Nigerian Naira', code: 'NGN' },
        GBP: { symbol: '£', rate: 0.79, name: 'British Pound', code: 'GBP' },
        EUR: { symbol: '€', rate: 0.92, name: 'Euro', code: 'EUR' }
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// Direct routes for standalone payment pages
app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get('/payment-stateful', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get('/payment-stateless', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment-stateless.html'));
});

// Fallback to index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
