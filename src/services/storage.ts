import { 
  Product, 
  UserAccount, 
  Transaction, 
  CustomerDebt, 
  PettyCashLog, 
  ShiftClosingReport, 
  CapitalLog, 
  StockFlowLog, 
  SystemSettings,
  CartItem,
  StockOpnameItem,
  StockOpnameReport
} from '../types';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_USERS, 
  INITIAL_SETTINGS 
} from './seedData';
import { syncDocToFirestore, deleteDocFromFirestore } from './firebase';
import { formatVariantDisplayName } from '../utils/variantFormat';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  PRODUCTS: 'pandir_products',
  CATEGORIES: 'pandir_categories',
  TRANSACTIONS: 'pandir_transactions',
  DEBTS: 'pandir_debts',
  PETTY_CASH: 'pandir_petty_cash',
  CLOSING_REPORTS: 'pandir_closing_reports',
  CAPITAL_LOGS: 'pandir_capital_logs',
  STOCK_LOGS: 'pandir_stock_logs',
  STOCK_OPNAME: 'pandir_stock_opname',
  USERS: 'pandir_users',
  SETTINGS: 'pandir_settings',
  OFFLINE_QUEUE: 'pandir_offline_queue',
};

class StorageService {
  constructor() {
    this.ensureInitialized();
  }

  public ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      try {
        const parsedUsers: UserAccount[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        let usersUpdated = false;
        const pandirIdx = parsedUsers.findIndex((u) => u.email.toLowerCase() === 'pandir@pandirstore.com');
        if (pandirIdx >= 0) {
          if (parsedUsers[pandirIdx].role !== 'admin' || parsedUsers[pandirIdx].status !== 'active') {
            parsedUsers[pandirIdx].role = 'admin';
            parsedUsers[pandirIdx].status = 'active';
            usersUpdated = true;
          }
        } else {
          parsedUsers.unshift({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
            email: 'pandir@pandirstore.com',
            username: 'pandir',
            name: 'Pemilik Toko (Admin Super)',
            role: 'admin',
            password: 'admin123',
            status: 'active',
            createdAt: new Date().toISOString(),
          });
          usersUpdated = true;
        }

        if (usersUpdated) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsedUsers));
        }
      } catch {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEBTS)) {
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PETTY_CASH)) {
      localStorage.setItem(STORAGE_KEYS.PETTY_CASH, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLOSING_REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.CLOSING_REPORTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CAPITAL_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.CAPITAL_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_OPNAME)) {
      localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'products' } }));
  }

  public updateProduct(updated: Product) {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === updated.id);
    if (index >= 0) {
      products[index] = { ...updated, updatedAt: new Date().toISOString() };
    } else {
      products.unshift({ ...updated, updatedAt: new Date().toISOString() });
    }
    this.saveProducts(products);
    syncDocToFirestore('products', updated.id, updated as unknown as Record<string, unknown>);
  }

  public deleteProduct(id: string) {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(products);
    deleteDocFromFirestore('products', id);
  }

  public async resetToDefaults() {
    if (typeof window === 'undefined') return;

    // 1. Clear LocalStorage & SessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }

    // 2. Set reset done flag to prevent re-seeding demo data
    localStorage.setItem('pandir_is_reset_done', 'true');

    // 3. Clear IndexedDB caches if supported
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        const dbs = await window.indexedDB.databases?.();
        if (dbs) {
          for (const dbInfo of dbs) {
            if (dbInfo.name) {
              window.indexedDB.deleteDatabase(dbInfo.name);
            }
          }
        }
      } catch {
        // Ignore IndexedDB deletion errors
      }
    }

    // 4. Initialize clean empty storage structures
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PETTY_CASH, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLOSING_REPORTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CAPITAL_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));

    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'reset' } }));
  }

  // --- CATEGORIES ---
  public getCategories(): string[] {
    try {
      const isResetDone = localStorage.getItem('pandir_is_reset_done') === 'true';
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const parsed = data ? JSON.parse(data) : null;
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 || isResetDone) {
          return parsed;
        }
      }
      return isResetDone ? [] : DEFAULT_CATEGORIES;
    } catch {
      return [];
    }
  }

  public saveCategories(categories: string[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'categories' } }));
  }

  // --- TRANSACTIONS ---
  public getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveTransactions(txs: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'transactions' } }));
  }

  public addTransaction(tx: Transaction) {
    const list = this.getTransactions();
    list.unshift(tx);
    this.saveTransactions(list);

    // If online, sync to Firestore
    syncDocToFirestore('transactions', tx.id, tx as unknown as Record<string, unknown>);

    // If offline, enqueue
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.enqueueOffline({ type: 'transaction', payload: tx });
    }
  }

  // --- DEBTS ---
  public getDebts(): CustomerDebt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEBTS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveDebts(debts: CustomerDebt[]) {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'debts' } }));
  }

  public addDebt(debt: CustomerDebt) {
    const debts = this.getDebts();
    debts.unshift(debt);
    this.saveDebts(debts);
    syncDocToFirestore('customer_debts', debt.id, debt as unknown as Record<string, unknown>);
  }

  public updateDebt(debt: CustomerDebt) {
    const debts = this.getDebts();
    const index = debts.findIndex((d) => d.id === debt.id);
    if (index >= 0) {
      debts[index] = debt;
    }
    this.saveDebts(debts);
    syncDocToFirestore('customer_debts', debt.id, debt as unknown as Record<string, unknown>);
  }

  // --- PETTY CASH ---
  public getPettyCash(): PettyCashLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PETTY_CASH);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public addPettyCash(entry: PettyCashLog) {
    const list = this.getPettyCash();
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.PETTY_CASH, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'petty_cash' } }));
    syncDocToFirestore('petty_cash_logs', entry.id, entry as unknown as Record<string, unknown>);
  }

  // --- CLOSING REPORTS ---
  public getClosingReports(): ShiftClosingReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLOSING_REPORTS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public addClosingReport(report: ShiftClosingReport) {
    const list = this.getClosingReports();
    list.unshift(report);
    localStorage.setItem(STORAGE_KEYS.CLOSING_REPORTS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'closing_reports' } }));
    syncDocToFirestore('closing_reports', report.id, report as unknown as Record<string, unknown>);
  }

  // --- CAPITAL LOGS ---
  public getCapitalLogs(): CapitalLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAPITAL_LOGS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public addCapitalLog(log: CapitalLog) {
    const list = this.getCapitalLogs();
    list.unshift(log);
    localStorage.setItem(STORAGE_KEYS.CAPITAL_LOGS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'capital_logs' } }));
    syncDocToFirestore('capital_logs', log.id, log as unknown as Record<string, unknown>);
  }

  // --- STOCK FLOW LOGS ---
  public getStockLogs(): StockFlowLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public addStockLog(log: StockFlowLog) {
    const list = this.getStockLogs();
    list.unshift(log);
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'stock_logs' } }));
    syncDocToFirestore('stock_flow_logs', log.id, log as unknown as Record<string, unknown>);
  }

  // --- STOCK OPNAME ---
  public getStockOpnameReports(): StockOpnameReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK_OPNAME);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveStockOpnameReports(reports: StockOpnameReport[]) {
    localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'stock_opname' } }));
  }

  public addStockOpnameReport(report: StockOpnameReport) {
    const list = this.getStockOpnameReports();
    list.unshift(report);
    this.saveStockOpnameReports(list);
    syncDocToFirestore('stock_opname_reports', report.id, report as unknown as Record<string, unknown>);
  }

  public applyStockOpname(params: {
    items: StockOpnameItem[];
    cashierName: string;
    cashierId?: string;
    notes?: string;
  }): { report: StockOpnameReport; updatedCount: number } {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const currentReports = this.getStockOpnameReports();
    const sequence = (currentReports.length + 1).toString().padStart(3, '0');
    const opnameNumber = `SO-${dateStr}-${sequence}`;

    const products = this.getProducts();
    let updatedCount = 0;
    const updatedProductsMap = new Map<string, Product>();

    // Process all items that have been counted (status is not belum_dihitung)
    const countedItems = params.items.filter((it) => it.status !== 'belum_dihitung');
    
    countedItems.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const oldStock = prod.stock;
        const newStock = Number(item.physicalStock) || 0;
        const diff = Math.round((newStock - oldStock) * 10000) / 10000;

        // If difference exists, adjust stock and log to Audit Log Stok
        if (Math.abs(diff) > 0.00001) {
          prod.stock = newStock;
          prod.updatedAt = now.toISOString();
          updatedProductsMap.set(prod.id, prod);
          updatedCount++;

          const log: StockFlowLog = {
            id: `sfl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            type: 'PENYESUAIAN_MANUAL',
            originalUnit: item.unit || prod.baseUnit,
            originalQuantity: Math.abs(diff),
            baseQuantityChange: diff,
            baseUnit: item.unit || prod.baseUnit,
            stockBefore: oldStock,
            stockAfter: newStock,
            referenceId: opnameNumber,
            notes: `[Stok Opname ${opnameNumber}] ${item.notes ? item.notes + ' - ' : ''}Penyesuaian Fisik: ${diff >= 0 ? '+' : ''}${diff} ${item.unit || prod.baseUnit} (Fisik: ${newStock}, Sistem: ${oldStock})`,
            timestamp: now.toISOString(),
            oldHppBase: prod.costBase || 0,
            newHppBase: prod.costBase || 0,
          };
          this.addStockLog(log);
        }
      }
    });

    if (updatedProductsMap.size > 0) {
      this.saveProducts(products);
      updatedProductsMap.forEach((p) => {
        syncDocToFirestore('products', p.id, p as unknown as Record<string, unknown>);
      });
    }

    const matchedCount = countedItems.filter((i) => i.status === 'sesuai').length;
    const shortageCount = countedItems.filter((i) => i.status === 'selisih_kurang').length;
    const surplusCount = countedItems.filter((i) => i.status === 'selisih_lebih').length;
    const totalSystemStock = Math.round(countedItems.reduce((acc, i) => acc + (Number(i.systemStock) || 0), 0) * 1000) / 1000;
    const totalPhysicalStock = Math.round(countedItems.reduce((acc, i) => acc + (Number(i.physicalStock) || 0), 0) * 1000) / 1000;
    const totalDifferenceQty = Math.round((totalPhysicalStock - totalSystemStock) * 1000) / 1000;
    const totalDifferenceValue = countedItems.reduce((acc, i) => acc + (Number(i.differenceValue) || 0), 0);

    const report: StockOpnameReport = {
      id: `so-${Date.now()}`,
      opnameNumber,
      date: now.toISOString(),
      cashierId: params.cashierId,
      cashierName: params.cashierName || 'Petugas Toko',
      totalProducts: params.items.length,
      countedProducts: countedItems.length,
      matchedCount,
      shortageCount,
      surplusCount,
      totalSystemStock,
      totalPhysicalStock,
      totalDifferenceQty,
      totalDifferenceValue,
      items: params.items,
      notes: params.notes,
      createdAt: now.toISOString(),
    };

    this.addStockOpnameReport(report);
    return { report, updatedCount };
  }

  // --- USERS ---
  public getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  public saveUsers(users: UserAccount[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'users' } }));
  }

  public updateUser(user: UserAccount) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push({ ...user, updatedAt: new Date().toISOString() });
    }
    this.saveUsers(users);
    syncDocToFirestore('users', user.id, user as unknown as Record<string, unknown>);
  }

  public deleteUser(userId: string) {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.saveUsers(users);
    deleteDocFromFirestore('users', userId);
  }

  // --- SETTINGS ---
  public getSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = data ? JSON.parse(data) : null;
      return parsed && typeof parsed === 'object' ? { ...INITIAL_SETTINGS, ...parsed } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  public saveSettings(settings: SystemSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('pandir_data_updated', { detail: { key: 'settings' } }));
    syncDocToFirestore('settings', 'store_config', settings as unknown as Record<string, unknown>);
  }

  // --- OFFLINE QUEUE ---
  public enqueueOffline(item: { type: string; payload: unknown }) {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      queue.push({ ...item, queuedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch {
      // ignore
    }
  }

  public getOfflineQueue(): Array<{ type: string; payload: unknown; queuedAt: string }> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    } catch {
      return [];
    }
  }

  public clearOfflineQueue() {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
  }

  // --- MULTI-TIER UNIT CONVERSION MATH ---

  /**
   * Returns available selectable units for a product in POS / Restock
   */
  public getAvailableUnitsForProduct(product: Product): { 
    unit: string; 
    ratio: number; 
    price: number; 
    cost: number; 
    label: string;
    variantId?: string;
    variantName?: string;
    isVariant?: boolean;
  }[] {
    const options: { 
      unit: string; 
      ratio: number; 
      price: number; 
      cost: number; 
      label: string;
      variantId?: string;
      variantName?: string;
      isVariant?: boolean;
    }[] = [];

    const isLiterOne = (nameStr: string) => {
      const s = (nameStr || '').trim().toLowerCase();
      return s === '1 liter' || s === '1liter' || s === '1 l' || s === '1l' || s === 'per 1 liter' || s === '1 liter (per 1 liter)';
    };

    // 0. If sub-variants/fractions are explicitly disabled by user toggle, return ONLY the primary base unit
    if (product.enableSubVariants === false) {
      const price = product.hargaJualKg || product.hargaJualDus || product.hargaJualPcs || product.priceBase || 0;
      const cost = product.costBase || 0;
      const unitLabel = product.baseUnit === 'kg' ? '1 KG' : product.baseUnit === 'liter' ? product.baseUnit.toUpperCase() : product.baseUnit.toUpperCase();
      return [{
        unit: unitLabel,
        ratio: 1,
        price,
        cost,
        label: `${unitLabel} (Rp ${price.toLocaleString('id-ID')})`,
      }];
    }

    // 1. Centralized Retail Packaging Variants (e.g. Dus, Renceng, Pcs or custom packaging variants)
    if (product.packagingVariants && product.packagingVariants.length > 0) {
      const validVariants = product.packagingVariants.filter((v) => !isLiterOne(v.name));
      if (validVariants.length > 0) {
        validVariants.forEach((v) => {
          const ratio = v.ratioToBase > 0 ? v.ratioToBase : 1;
          const cost = v.costPrice || Math.round((product.costBase || 0) * ratio);
          const displayName = formatVariantDisplayName(product, { name: v.name, ratioToBase: ratio }, { style: 'short' });
          options.push({
            unit: displayName,
            ratio: ratio,
            price: v.sellingPrice || 0,
            cost: cost,
            label: `${displayName} (Rp ${(v.sellingPrice || 0).toLocaleString('id-ID')})`,
            variantId: v.id,
            variantName: displayName,
            isVariant: true,
          });
        });

        return options;
      }
    }

    // 2. 3-Tier Multi-Unit Conversion (Dus -> Renceng -> Pcs) - Legacy Support
    if (product.rasioRencengPerDus && product.rasioPcsPerRenceng) {
      const rencengRatio = product.rasioPcsPerRenceng;
      const totalPcsPerDus = product.rasioRencengPerDus * product.rasioPcsPerRenceng;
      
      const pricePcs = product.hargaJualPcs || product.priceBase || 0;
      const priceRenceng = product.hargaJualRenceng || Math.round(pricePcs * rencengRatio);
      const priceDus = product.hargaJualDus || Math.round(pricePcs * totalPcsPerDus);

      if (priceDus > 0) {
        options.push({
          unit: 'dus',
          ratio: totalPcsPerDus,
          price: priceDus,
          cost: (product.costBase || 0) * totalPcsPerDus,
          label: `Dus (${totalPcsPerDus} Pcs: Rp ${priceDus.toLocaleString('id-ID')})`,
        });
      }
      if (priceRenceng > 0) {
        options.push({
          unit: 'renceng',
          ratio: rencengRatio,
          price: priceRenceng,
          cost: (product.costBase || 0) * rencengRatio,
          label: `Renceng (${rencengRatio} Pcs: Rp ${priceRenceng.toLocaleString('id-ID')})`,
        });
      }
      if (pricePcs > 0 || options.length === 0) {
        options.push({
          unit: 'pcs',
          ratio: 1,
          price: pricePcs,
          cost: product.costBase || 0,
          label: `Pcs (Rp ${pricePcs.toLocaleString('id-ID')})`,
        });
      }
      if (options.length > 0) {
        return options;
      }
    }

    // 3. Multi-Price Variants for Weighted Items (KG) - return strictly user base/tiers without static preset sub-units
    if (product.baseUnit === 'kg' || product.isWeighable || product.hargaJualKg) {
      const priceKg = product.hargaJualKg ?? product.priceBase ?? 0;
      const costKg = product.costBase || 0;

      const kgOptions: { 
        unit: string; 
        ratio: number; 
        price: number; 
        cost: number; 
        label: string;
        variantId?: string;
        variantName?: string;
        isVariant?: boolean;
      }[] = [];

      kgOptions.push({
        unit: 'KG',
        ratio: 1.0,
        price: priceKg,
        cost: costKg,
        label: `KG (Rp ${priceKg.toLocaleString('id-ID')})`,
      });

      // Wholesale Karung / Sack tier option if present
      if (product.tierConfig?.tier3Name && product.tierConfig?.tier3Ratio) {
        const ratio = product.tierConfig.tier3Ratio;
        const price = product.tierConfig.priceTier3 || priceKg * ratio;
        const cost = product.tierConfig.costTier3 || costKg * ratio;
        kgOptions.push({
          unit: product.tierConfig.tier3Name,
          ratio: ratio,
          price: price,
          cost: cost,
          label: `${product.tierConfig.tier3Name.toUpperCase()} (Isi ${ratio} kg: Rp ${price.toLocaleString('id-ID')})`,
        });
      }

      return kgOptions;
    }

    // 4. Liquid / Liter Items - return user base unit without hardcoded '1 Liter', '500 ml', '250 ml', 'liter'
    if (product.baseUnit === 'liter') {
      const priceL = product.priceBase || 0;
      const costL = product.costBase || 0;

      return [
        {
          unit: 'Liter',
          ratio: 1.0,
          price: priceL,
          cost: costL,
          label: `Liter (Rp ${priceL.toLocaleString('id-ID')})`,
        }
      ];
    }

    // 5. Default Base Unit (Master Unit: PCS / Bungkus / Saset / etc.)
    options.push({
      unit: product.baseUnit,
      ratio: 1,
      price: product.priceBase || 0,
      cost: product.costBase || 0,
      label: `${product.baseUnit.toUpperCase()} (Rp ${(product.priceBase || 0).toLocaleString('id-ID')})`,
    });

    // Tier 2 (Renteng / Grosir Kecil)
    if (product.tierConfig?.tier2Name && product.tierConfig?.tier2Ratio) {
      const ratio = product.tierConfig.tier2Ratio;
      const price = product.tierConfig.priceTier2 || (product.priceBase || 0) * ratio;
      const cost = product.tierConfig.costTier2 || (product.costBase || 0) * ratio;
      options.push({
        unit: product.tierConfig.tier2Name,
        ratio: ratio,
        price: price,
        cost: cost,
        label: `${product.tierConfig.tier2Name.toUpperCase()} (Isi ${ratio} ${product.baseUnit}: Rp ${price.toLocaleString('id-ID')})`,
      });
    }

    // Tier 3 (Dus / Karung / Peti)
    if (product.tierConfig?.tier3Name && product.tierConfig?.tier3Ratio) {
      const ratio = product.tierConfig.tier3Ratio;
      const price = product.tierConfig.priceTier3 || (product.priceBase || 0) * ratio;
      const cost = product.tierConfig.costTier3 || (product.costBase || 0) * ratio;
      options.push({
        unit: product.tierConfig.tier3Name,
        ratio: ratio,
        price: price,
        cost: cost,
        label: `${product.tierConfig.tier3Name.toUpperCase()} (Isi ${ratio} ${product.baseUnit}: Rp ${price.toLocaleString('id-ID')})`,
      });
    }

    // Deduplicate options by unit name (case-insensitive) or variantId
    const seen = new Set<string>();
    return options.filter((opt) => {
      const key = (opt.variantId || opt.unit).toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Helper to build a cart item with accurate conversion and subtotal
   */
  public buildCartItem(
    product: Product, 
    selectedUnit: string, 
    quantity: number, 
    discount: number = 0,
    variantId?: string
  ): CartItem {
    const available = this.getAvailableUnitsForProduct(product);
    const matched = available.find((u) => {
      if (variantId && u.variantId === variantId) return true;
      const selNorm = selectedUnit.toLowerCase().replace(/\s+/g, '');
      const unitNorm = u.unit.toLowerCase().replace(/\s+/g, '');
      if (selNorm === unitNorm) return true;
      if (unitNorm.startsWith(selNorm) || selNorm.startsWith(unitNorm)) return true;
      if ((selNorm === '1kg' || selNorm === 'kg') && (unitNorm === '1kg' || unitNorm === 'kg')) return true;
      if ((selNorm === '1liter' || selNorm === 'liter') && (unitNorm === '1liter' || unitNorm === 'liter')) return true;
      return false;
    }) || available[0] || {
      unit: product.baseUnit,
      ratio: 1,
      price: product.priceBase || 0,
      cost: product.costBase || 0,
      label: product.baseUnit,
    };

    const safeQty = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    const safeDiscount = isNaN(discount) || discount < 0 ? 0 : discount;
    const unitMultiplier = matched.ratio > 0 ? matched.ratio : 1;
    const unitPrice = isNaN(matched.price) ? 0 : matched.price;
    const costPrice = isNaN(matched.cost) ? 0 : matched.cost;
    const baseQuantity = Math.round((safeQty * unitMultiplier) * 10000) / 10000;
    const subtotal = Math.max(0, Math.round(unitPrice * safeQty - safeDiscount));
    const totalCost = Math.round(costPrice * safeQty);

    return {
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      category: product.category,
      isWeighable: product.isWeighable,
      variantId: matched.variantId,
      variantName: matched.variantName,
      selectedUnit: matched.unit,
      unitMultiplier,
      quantity,
      baseQuantity,
      unitPrice,
      costPrice,
      discount,
      subtotal,
      totalCost,
    };
  }

  // --- EXCEL EXPORT WITH CUSTOM DATE RANGE ---
  public exportTransactionsToExcel(
    startDateStr: string, 
    endDateStr: string, 
    options?: { paymentFilter?: string; categoryFilter?: string }
  ) {
    const all = this.getTransactions();

    const start = new Date(`${startDateStr}T00:00:00`);
    const end = new Date(`${endDateStr}T23:59:59.999`);

    const filtered = all.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      if (txDate < start || txDate > end) return false;
      if (options?.paymentFilter && options.paymentFilter !== 'all') {
        if (tx.paymentMethod !== options.paymentFilter) return false;
      }
      if (options?.categoryFilter && options.categoryFilter !== 'all') {
        const hasCat = tx.items.some((i) => i.category === options.categoryFilter);
        if (!hasCat) return false;
      }
      return true;
    });

    // 1. Sheet 1: Rekap Transaksi
    const headerRows = [
      ['PANDIR STORE - REKAPITULASI RIWAYAT TRANSAKSI'],
      ['Periode Rentang Tanggal:', `${startDateStr} s/d ${endDateStr}`],
      ['Dicetak Pada:', new Date().toLocaleString('id-ID')],
      ['Filter Metode Bayar:', options?.paymentFilter ? options.paymentFilter.toUpperCase() : 'SEMUA'],
      [],
      [
        'No',
        'Nomor Invoice',
        'Tanggal',
        'Waktu',
        'Kasir',
        'Metode Bayar',
        'Pelanggan',
        'No WhatsApp',
        'Jatuh Tempo',
        'Rincian Barang',
        'Total Belanja (Omset)',
        'Total HPP (Modal)',
        'Laba Bersih'
      ]
    ];

    const dataRows = filtered.map((tx, idx) => {
      const dt = new Date(tx.timestamp);
      const datePart = dt.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timePart = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const itemsDetail = tx.items
        .map((i) => `${i.productName} (${i.quantity} ${i.selectedUnit} @ Rp ${i.unitPrice.toLocaleString('id-ID')})`)
        .join('; ');

      return [
        idx + 1,
        tx.invoiceNumber,
        datePart,
        timePart,
        tx.cashierName,
        tx.paymentMethod.toUpperCase(),
        tx.customerName || '-',
        tx.customerPhone || '-',
        tx.dueDate ? new Date(tx.dueDate).toLocaleDateString('id-ID') : '-',
        itemsDetail,
        tx.totalAmount,
        tx.totalCost,
        tx.profit,
      ];
    });

    const firstDataRow = 7; // 1-indexed Excel row
    const lastDataRow = firstDataRow + Math.max(0, filtered.length - 1);

    const totalOmset = filtered.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalModal = filtered.reduce((acc, t) => acc + t.totalCost, 0);
    const totalLaba = filtered.reduce((acc, t) => acc + t.profit, 0);

    const totalRow = [
      'TOTAL REKAPITULASI',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `${filtered.length} Transaksi`,
      filtered.length > 0 ? { f: `SUM(K${firstDataRow}:K${lastDataRow})`, v: totalOmset } : 0,
      filtered.length > 0 ? { f: `SUM(L${firstDataRow}:L${lastDataRow})`, v: totalModal } : 0,
      filtered.length > 0 ? { f: `SUM(M${firstDataRow}:M${lastDataRow})`, v: totalLaba } : 0,
    ];

    const allSheet1Rows = [...headerRows, ...dataRows, [], totalRow];
    const ws1 = XLSX.utils.aoa_to_sheet(allSheet1Rows);

    // Set Column Widths for Sheet 1
    ws1['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // Invoice
      { wch: 12 }, // Tanggal
      { wch: 10 }, // Waktu
      { wch: 16 }, // Kasir
      { wch: 14 }, // Metode
      { wch: 18 }, // Pelanggan
      { wch: 15 }, // WA
      { wch: 12 }, // Jatuh Tempo
      { wch: 45 }, // Rincian Barang
      { wch: 20 }, // Total Omset
      { wch: 18 }, // Total HPP
      { wch: 18 }, // Laba Bersih
    ];

    // 2. Sheet 2: Detail Produk Terjual (Itemized)
    const itemRowsHeader = [
      ['PANDIR STORE - RINCIAN DETAIL PRODUK TERJUAL'],
      ['Periode Rentang Tanggal:', `${startDateStr} s/d ${endDateStr}`],
      [],
      [
        'No',
        'Nomor Invoice',
        'Tanggal Transaksi',
        'Kode SKU',
        'Nama Produk',
        'Kategori',
        'Jumlah (Qty)',
        'Satuan',
        'Harga Jual Satuan (Rp)',
        'Diskon Item (Rp)',
        'Total Penjualan (Rp)',
        'Modal HPP Satuan (Rp)',
        'Total Modal (Rp)',
        'Laba Produk (Rp)'
      ]
    ];

    const itemDataRows: (string | number | { f: string; v: number })[][] = [];
    let itemIndex = 1;

    filtered.forEach((tx) => {
      const dt = new Date(tx.timestamp).toLocaleDateString('id-ID');
      tx.items.forEach((item) => {
        const itemProfit = item.subtotal - item.totalCost;
        itemDataRows.push([
          itemIndex++,
          tx.invoiceNumber,
          dt,
          item.productCode,
          item.productName,
          item.category,
          item.quantity,
          item.selectedUnit,
          item.unitPrice,
          item.discount || 0,
          item.subtotal,
          item.costPrice,
          item.totalCost,
          itemProfit,
        ]);
      });
    });

    const itemFirstRow = 5;
    const itemLastRow = itemFirstRow + Math.max(0, itemDataRows.length - 1);
    const totalItemSales = itemDataRows.reduce((acc, row) => acc + (Number(row[10]) || 0), 0);
    const totalItemCost = itemDataRows.reduce((acc, row) => acc + (Number(row[12]) || 0), 0);
    const totalItemProfit = itemDataRows.reduce((acc, row) => acc + (Number(row[13]) || 0), 0);

    const itemTotalRow = [
      'TOTAL BARANG TERJUAL',
      '',
      '',
      '',
      '',
      '',
      itemDataRows.length > 0 ? { f: `SUM(G${itemFirstRow}:G${itemLastRow})`, v: itemDataRows.reduce((acc, r) => acc + (Number(r[6]) || 0), 0) } : 0,
      'Item',
      '',
      '',
      itemDataRows.length > 0 ? { f: `SUM(K${itemFirstRow}:K${itemLastRow})`, v: totalItemSales } : 0,
      '',
      itemDataRows.length > 0 ? { f: `SUM(M${itemFirstRow}:M${itemLastRow})`, v: totalItemCost } : 0,
      itemDataRows.length > 0 ? { f: `SUM(N${itemFirstRow}:N${itemLastRow})`, v: totalItemProfit } : 0,
    ];

    const ws2 = XLSX.utils.aoa_to_sheet([...itemRowsHeader, ...itemDataRows, [], itemTotalRow]);
    ws2['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // Invoice
      { wch: 14 }, // Tanggal
      { wch: 12 }, // Kode
      { wch: 30 }, // Nama Produk
      { wch: 16 }, // Kategori
      { wch: 12 }, // Qty
      { wch: 10 }, // Satuan
      { wch: 18 }, // Harga Jual
      { wch: 15 }, // Diskon
      { wch: 20 }, // Total Penjualan
      { wch: 18 }, // HPP Satuan
      { wch: 18 }, // Total Modal
      { wch: 18 }, // Laba
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws1, 'Rekap Transaksi');
    XLSX.utils.book_append_sheet(workbook, ws2, 'Detail Barang Terjual');

    const fileName = `Laporan_Transaksi_PANDIR_${startDateStr}_sd_${endDateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return { count: filtered.length, fileName, totalOmset, totalLaba };
  }

  // --- STOK OPNAME EXCEL EXPORT (ACTIVE SESSION / ITEMS) ---
  public exportStockOpnameToExcel(
    items: StockOpnameItem[],
    meta?: {
      opnameNumber?: string;
      cashierName?: string;
      date?: string;
      notes?: string;
      title?: string;
    }
  ) {
    const title = meta?.title || 'FORMULIR & HASIL STOK OPNAME (SO)';
    const opnameNo = meta?.opnameNumber || `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const opnameDate = meta?.date ? new Date(meta.date).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID');
    const cashier = meta?.cashierName || 'Petugas Toko';

    const headerRows = [
      [`PANDIR STORE - ${title}`],
      ['Nomor Laporan / Dokumen SO:', opnameNo],
      ['Tanggal Pelaksanaan:', opnameDate],
      ['Petugas Pemeriksa:', cashier],
      ['Catatan Dokumen:', meta?.notes || '-'],
      [],
      [
        'No',
        'Kode / SKU',
        'Nama Barang Sembako',
        'Kategori',
        'Satuan',
        'Stok Sistem (DB)',
        'Stok Fisik (Hitung)',
        'Selisih (Fisik - Sistem)',
        'Status',
        'Harga Modal HPP (Rp)',
        'Nilai Selisih (Rp)',
        'Keterangan'
      ]
    ];

    const firstDataRow = 8; // 1-indexed in Excel (row 8)
    const dataRows = items.map((it, idx) => {
      const curRow = firstDataRow + idx;
      const statusLabel = 
        it.status === 'sesuai' 
          ? 'Sesuai' 
          : it.status === 'selisih_kurang' 
          ? 'Selisih Kurang' 
          : it.status === 'selisih_lebih' 
          ? 'Selisih Lebih' 
          : 'Belum Dihitung';

      const cost = it.costBase || 0;
      const sysStock = Number(it.systemStock) || 0;
      const physStock = Number(it.physicalStock) || 0;
      const diff = physStock - sysStock;
      const diffVal = diff * cost;

      return [
        idx + 1,
        it.productCode,
        it.productName,
        it.category,
        it.unit,
        sysStock,
        physStock,
        // Formula for Difference: Stok Fisik (G) - Stok Sistem (F)
        { f: `G${curRow}-F${curRow}`, v: diff },
        statusLabel,
        cost,
        // Formula for Difference Value: Selisih (H) * HPP (J)
        { f: `H${curRow}*J${curRow}`, v: diffVal },
        it.notes || ''
      ];
    });

    const lastDataRow = firstDataRow + Math.max(0, items.length - 1);

    const totalSystemStock = items.reduce((acc, it) => acc + (Number(it.systemStock) || 0), 0);
    const totalPhysicalStock = items.reduce((acc, it) => acc + (Number(it.physicalStock) || 0), 0);
    const totalDiffQty = totalPhysicalStock - totalSystemStock;
    const totalDiffVal = items.reduce((acc, it) => acc + (Number(it.differenceValue) || 0), 0);

    const totalRow = [
      'TOTAL REKAPITULASI STOK OPNAME',
      '',
      '',
      '',
      `${items.length} Produk`,
      items.length > 0 ? { f: `SUM(F${firstDataRow}:F${lastDataRow})`, v: totalSystemStock } : 0,
      items.length > 0 ? { f: `SUM(G${firstDataRow}:G${lastDataRow})`, v: totalPhysicalStock } : 0,
      items.length > 0 ? { f: `SUM(H${firstDataRow}:H${lastDataRow})`, v: totalDiffQty } : 0,
      '',
      '',
      items.length > 0 ? { f: `SUM(K${firstDataRow}:K${lastDataRow})`, v: totalDiffVal } : 0,
      ''
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows, [], totalRow]);

    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 14 }, // SKU
      { wch: 32 }, // Nama Barang
      { wch: 16 }, // Kategori
      { wch: 10 }, // Satuan
      { wch: 16 }, // Stok Sistem
      { wch: 16 }, // Stok Fisik
      { wch: 22 }, // Selisih
      { wch: 16 }, // Status
      { wch: 18 }, // HPP
      { wch: 18 }, // Nilai Selisih
      { wch: 28 }, // Keterangan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Opname');

    const fileName = `Stok_Opname_${opnameNo}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return { count: items.length, fileName, totalDiffQty, totalDiffVal };
  }

  // --- STOK OPNAME REPORTS BY CUSTOM DATE RANGE ---
  public exportStockOpnameHistoryToExcel(
    startDateStr: string,
    endDateStr: string
  ) {
    const allReports = this.getStockOpnameReports();
    const start = new Date(`${startDateStr}T00:00:00`);
    const end = new Date(`${endDateStr}T23:59:59.999`);

    const filtered = allReports.filter((rep) => {
      const repDate = new Date(rep.date || rep.createdAt);
      return repDate >= start && repDate <= end;
    });

    const headerRows = [
      ['PANDIR STORE - REKAPITULASI RIWAYAT STOK OPNAME (SO)'],
      ['Periode Rentang Tanggal:', `${startDateStr} s/d ${endDateStr}`],
      ['Total Sesi SO Dilakukan:', filtered.length],
      ['Waktu Ekspor:', new Date().toLocaleString('id-ID')],
      [],
      [
        'No',
        'Nomor SO',
        'Tanggal SO',
        'Petugas / Kasir',
        'Total Produk Diperiksa',
        'Sesuai',
        'Selisih Kurang',
        'Selisih Lebih',
        'Total Stok Sistem',
        'Total Stok Fisik',
        'Total Selisih Qty',
        'Total Nilai Selisih (Rp)',
        'Catatan'
      ]
    ];

    const firstRow = 7;
    const dataRows = filtered.map((rep, idx) => {
      const dt = new Date(rep.date || rep.createdAt).toLocaleDateString('id-ID');
      return [
        idx + 1,
        rep.opnameNumber,
        dt,
        rep.cashierName,
        rep.countedProducts,
        rep.matchedCount,
        rep.shortageCount,
        rep.surplusCount,
        rep.totalSystemStock,
        rep.totalPhysicalStock,
        rep.totalDifferenceQty,
        rep.totalDifferenceValue,
        rep.notes || '-',
      ];
    });

    const lastRow = firstRow + Math.max(0, filtered.length - 1);
    const sumSystem = filtered.reduce((acc, r) => acc + (r.totalSystemStock || 0), 0);
    const sumPhys = filtered.reduce((acc, r) => acc + (r.totalPhysicalStock || 0), 0);
    const sumDiffQty = filtered.reduce((acc, r) => acc + (r.totalDifferenceQty || 0), 0);
    const sumDiffVal = filtered.reduce((acc, r) => acc + (r.totalDifferenceValue || 0), 0);

    const totalRow = [
      'TOTAL REKAPITULASI RIWAYAT SO',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      filtered.length > 0 ? { f: `SUM(I${firstRow}:I${lastRow})`, v: sumSystem } : 0,
      filtered.length > 0 ? { f: `SUM(J${firstRow}:J${lastRow})`, v: sumPhys } : 0,
      filtered.length > 0 ? { f: `SUM(K${firstRow}:K${lastRow})`, v: sumDiffQty } : 0,
      filtered.length > 0 ? { f: `SUM(L${firstRow}:L${lastRow})`, v: sumDiffVal } : 0,
      ''
    ];

    const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows, [], totalRow]);
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // Nomor SO
      { wch: 14 }, // Tanggal
      { wch: 18 }, // Petugas
      { wch: 14 }, // Produk
      { wch: 10 }, // Sesuai
      { wch: 14 }, // Kurang
      { wch: 14 }, // Lebih
      { wch: 18 }, // Stok Sistem
      { wch: 18 }, // Stok Fisik
      { wch: 18 }, // Selisih Qty
      { wch: 20 }, // Nilai Selisih Rp
      { wch: 30 }, // Catatan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Riwayat Stok Opname');

    const fileName = `Rekap_Stok_Opname_${startDateStr}_sd_${endDateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return { count: filtered.length, fileName };
  }
}

export const storage = new StorageService();
