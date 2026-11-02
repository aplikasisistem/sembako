import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Product, UnitType, RetailPackagingVariant, HppCalculationMethod, ProductPriceUpdatePayload } from '../types';
import { storage } from '../services/storage';
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  PackagePlus, 
  Layers,
  Scale,
  Calculator,
  Package,
  Droplets,
  Lock,
  Sparkles,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  DollarSign,
  FileText
} from 'lucide-react';
import { FormattedNumberInput } from '../components/FormattedNumberInput';
import { StockConversionCalculator } from '../components/StockConversionCalculator';
import { formatNumberWithDots } from '../utils/numberFormat';

export const InventoryPage: React.FC = () => {
  const { products, categories, stockLogs, saveProduct, deleteProduct, restockProduct } = useStore();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'inventory' | 'stock_logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Restock Modal State
  const [restockProductTarget, setRestockProductTarget] = useState<Product | null>(null);
  const [restockUnit, setRestockUnit] = useState<string>('');
  const [restockQty, setRestockQty] = useState<number>(1);
  const [restockCost, setRestockCost] = useState<number>(0);
  const [restockHppMethod, setRestockHppMethod] = useState<HppCalculationMethod>('weighted_average');
  const [restockRecordPettyCash, setRestockRecordPettyCash] = useState<boolean>(true);
  const [restockNotes, setRestockNotes] = useState<string>('');

  // Restock Selling Price Adjustment States
  const [restockPriceBase, setRestockPriceBase] = useState<number>(0);
  const [restockHargaJualKg, setRestockHargaJualKg] = useState<number>(0);
  const [restockHargaJualGram500, setRestockHargaJualGram500] = useState<number>(0);
  const [restockHargaJualGram250, setRestockHargaJualGram250] = useState<number>(0);
  const [restockHargaJualGram100, setRestockHargaJualGram100] = useState<number>(0);
  const [restockHargaJualDus, setRestockHargaJualDus] = useState<number>(0);
  const [restockHargaJualRenceng, setRestockHargaJualRenceng] = useState<number>(0);
  const [restockHargaJualPcs, setRestockHargaJualPcs] = useState<number>(0);
  const [restockPackagingVariants, setRestockPackagingVariants] = useState<RetailPackagingVariant[]>([]);
  const [restockEnableSubVariants, setRestockEnableSubVariants] = useState<boolean>(true);
  const [restockShowPriceAdjust, setRestockShowPriceAdjust] = useState<boolean>(true);

  // Add / Edit / Delete Product Modal State (Isolated per tab)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productType, setProductType] = useState<'kg' | 'box' | 'pcs' | 'liter' | null>(null);
  const [deletingProductTarget, setDeletingProductTarget] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Common product fields across all tabs
  const [formCommon, setFormCommon] = useState<{
    id?: string;
    code: string;
    name: string;
    category: string;
    minStockAlert: number;
    enableSubVariants: boolean;
  }>({
    code: '',
    name: '',
    category: 'Beras & Tepung',
    minStockAlert: 10,
    enableSubVariants: true,
  });

  // Isolated tab form states
  const [kgFormState, setKgFormState] = useState<{
    stock: number;
    totalPurchaseCost: number;
    costBase: number;
    priceBase: number;
    hargaJualKg: number;
    hargaJualGram500: number;
    hargaJualGram250: number;
    hargaJualGram100: number;
    packagingVariants: RetailPackagingVariant[];
  }>({
    stock: 0,
    totalPurchaseCost: 0,
    costBase: 0,
    priceBase: 0,
    hargaJualKg: 0,
    hargaJualGram500: 0,
    hargaJualGram250: 0,
    hargaJualGram100: 0,
    packagingVariants: [],
  });

  const [boxFormState, setBoxFormState] = useState<{
    boxSubUnitType: 'renceng' | 'pcs';
    rasioRencengPerDus: number;
    rasioPcsPerRenceng: number;
    rasioPcsPerDus: number;
    totalBoxes: number;
    totalPurchaseCost: number;
    costBase: number;
    priceBase: number;
    hargaJualDus: number;
    hargaJualRenceng: number;
    hargaJualPcs: number;
    packagingVariants: RetailPackagingVariant[];
  }>({
    boxSubUnitType: 'renceng',
    rasioRencengPerDus: 0,
    rasioPcsPerRenceng: 0,
    rasioPcsPerDus: 0,
    totalBoxes: 0,
    totalPurchaseCost: 0,
    costBase: 0,
    priceBase: 0,
    hargaJualDus: 0,
    hargaJualRenceng: 0,
    hargaJualPcs: 0,
    packagingVariants: [],
  });

  const [pcsFormState, setPcsFormState] = useState<{
    baseUnit: UnitType;
    stock: number;
    totalPurchaseCost: number;
    costBase: number;
    priceBase: number;
    packagingVariants: RetailPackagingVariant[];
  }>({
    baseUnit: 'pcs',
    stock: 0,
    totalPurchaseCost: 0,
    costBase: 0,
    priceBase: 0,
    packagingVariants: [],
  });

  const [literFormState, setLiterFormState] = useState<{
    baseUnit: UnitType;
    stock: number;
    totalPurchaseCost: number;
    costBase: number;
    priceBase: number;
    packagingVariants: RetailPackagingVariant[];
  }>({
    baseUnit: 'liter',
    stock: 0,
    totalPurchaseCost: 0,
    costBase: 0,
    priceBase: 0,
    packagingVariants: [],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === 'low') matchStatus = p.stock <= p.minStockAlert && p.stock > 0;
    if (statusFilter === 'out') matchStatus = p.stock <= 0;

    return matchCategory && matchSearch && matchStatus;
  });

  // Open Restock Modal
  const handleOpenRestock = (product: Product) => {
    setRestockProductTarget(product);
    const available = storage.getAvailableUnitsForProduct(product);
    const defaultUnit = product.tierConfig?.tier3Name || available[0]?.unit || product.baseUnit;
    setRestockUnit(defaultUnit);
    setRestockQty(1);
    const matched = available.find((u) => u.unit === defaultUnit) || available[0];
    setRestockCost(matched?.cost || product.costBase || 0);
    setRestockHppMethod('weighted_average');
    setRestockRecordPettyCash(true);
    setRestockNotes('Restok dari supplier');

    const pBase = product.priceBase || 0;
    const pKg = product.hargaJualKg ?? pBase;
    setRestockPriceBase(pBase);
    setRestockHargaJualKg(pKg);
    setRestockHargaJualGram500(product.hargaJualGram500 ?? (pKg > 0 ? Math.round((pKg * 0.5) / 100) * 100 : 0));
    setRestockHargaJualGram250(product.hargaJualGram250 ?? (pKg > 0 ? Math.round((pKg * 0.25) / 100) * 100 : 0));
    setRestockHargaJualGram100(product.hargaJualGram100 ?? (pKg > 0 ? Math.round((pKg * 0.1) / 100) * 100 : 0));
    setRestockHargaJualDus(product.hargaJualDus ?? 0);
    setRestockHargaJualRenceng(product.hargaJualRenceng ?? 0);
    setRestockHargaJualPcs(product.hargaJualPcs ?? pBase);
    setRestockPackagingVariants(
      product.packagingVariants ? product.packagingVariants.map((v) => ({ ...v })) : []
    );
    setRestockEnableSubVariants(product.enableSubVariants !== false);
    setRestockShowPriceAdjust(true);
  };

  const handleExecuteRestock = () => {
    if (!restockProductTarget || restockQty <= 0) return;

    const priceUpdates: ProductPriceUpdatePayload = {
      priceBase: restockPriceBase,
      hargaJualKg: restockHargaJualKg,
      hargaJualGram500: restockHargaJualGram500,
      hargaJualGram250: restockHargaJualGram250,
      hargaJualGram100: restockHargaJualGram100,
      hargaJualDus: restockHargaJualDus,
      hargaJualRenceng: restockHargaJualRenceng,
      hargaJualPcs: restockHargaJualPcs,
      packagingVariants: restockPackagingVariants,
      enableSubVariants: restockEnableSubVariants,
    };

    restockProduct(
      restockProductTarget.id, 
      restockUnit, 
      restockQty, 
      restockNotes, 
      restockCost,
      restockHppMethod,
      restockRecordPettyCash,
      priceUpdates
    );
    showToast(`Restok ${restockQty} ${restockUnit} "${restockProductTarget.name}" berhasil diproses & harga jual disinkronkan ke kasir!`);
    setRestockProductTarget(null);
  };

  // Open New Product Form
  const handleOpenAddProduct = () => {
    setFormError(null);
    setProductType(null);
    setFormCommon({
      id: `prod-${Date.now()}`,
      code: `BRG-${(products.length + 1).toString().padStart(3, '0')}`,
      name: '',
      category: categories[0] || 'Beras & Tepung',
      minStockAlert: 0,
      enableSubVariants: true,
    });
    setKgFormState({
      stock: 0,
      totalPurchaseCost: 0,
      costBase: 0,
      priceBase: 0,
      hargaJualKg: 0,
      hargaJualGram500: 0,
      hargaJualGram250: 0,
      hargaJualGram100: 0,
      packagingVariants: [],
    });
    setBoxFormState({
      boxSubUnitType: 'renceng',
      rasioRencengPerDus: 0,
      rasioPcsPerRenceng: 0,
      rasioPcsPerDus: 0,
      totalBoxes: 0,
      totalPurchaseCost: 0,
      costBase: 0,
      priceBase: 0,
      hargaJualDus: 0,
      hargaJualRenceng: 0,
      hargaJualPcs: 0,
      packagingVariants: [],
    });
    setPcsFormState({
      baseUnit: 'pcs',
      stock: 0,
      totalPurchaseCost: 0,
      costBase: 0,
      priceBase: 0,
      packagingVariants: [],
    });
    setLiterFormState({
      baseUnit: 'liter',
      stock: 0,
      totalPurchaseCost: 0,
      costBase: 0,
      priceBase: 0,
      packagingVariants: [],
    });
    setIsEditModalOpen(true);
  };

  // Open Edit Product Form
  const handleOpenEditProduct = (p: Product) => {
    setFormError(null);
    let initialType: 'kg' | 'box' | 'pcs' | 'liter' = 'pcs';

    if (p.productType) {
      initialType = p.productType;
    } else if (
      p.isWeighable ||
      p.baseUnit === 'kg' ||
      p.baseUnit === 'gram' ||
      p.hargaJualKg !== undefined ||
      (p.packagingVariants && p.packagingVariants.some((v) => v.unitLabel?.toLowerCase().includes('kg') || v.name?.toLowerCase().includes('kg') || v.name?.toLowerCase().includes('gram')))
    ) {
      initialType = 'kg';
    } else if (
      p.baseUnit === 'liter' ||
      p.baseUnit === 'botol' ||
      p.baseUnit === 'jerigen' ||
      (p.packagingVariants && p.packagingVariants.some((v) => v.unitLabel?.toLowerCase().includes('liter') || v.name?.toLowerCase().includes('ml') || v.name?.toLowerCase().includes('liter')))
    ) {
      initialType = 'liter';
    } else if (
      (p.rasioRencengPerDus && p.rasioPcsPerRenceng) ||
      p.hargaJualDus !== undefined ||
      p.hargaJualRenceng !== undefined ||
      p.tierConfig?.tier3Name === 'dus' ||
      p.baseUnit === 'dus' ||
      (p.packagingVariants && p.packagingVariants.some((v) => v.name?.toLowerCase().includes('dus') || v.name?.toLowerCase().includes('box') || v.name?.toLowerCase().includes('renceng') || v.name?.toLowerCase().includes('renteng')))
    ) {
      initialType = 'box';
    } else {
      initialType = 'pcs';
    }

    setProductType(initialType);
    setFormCommon({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      minStockAlert: p.minStockAlert ?? 5,
      enableSubVariants: p.enableSubVariants !== false,
    });

    const pVariants = p.packagingVariants ? p.packagingVariants.map((v) => ({ ...v })) : [];

    // Populate KG state
    setKgFormState({
      stock: initialType === 'kg' ? (p.stock || 0) : 0,
      totalPurchaseCost: initialType === 'kg' ? (p.totalPurchaseCost || Math.round((p.stock || 0) * (p.costBase || 0))) : 0,
      costBase: initialType === 'kg' ? (p.costBase || 0) : 0,
      priceBase: initialType === 'kg' ? (p.priceBase || p.hargaJualKg || 0) : 0,
      hargaJualKg: initialType === 'kg' ? (p.hargaJualKg ?? p.priceBase ?? 0) : 0,
      hargaJualGram500: initialType === 'kg' ? (p.hargaJualGram500 ?? 0) : 0,
      hargaJualGram250: initialType === 'kg' ? (p.hargaJualGram250 ?? 0) : 0,
      hargaJualGram100: initialType === 'kg' ? (p.hargaJualGram100 ?? 0) : 0,
      packagingVariants: initialType === 'kg' ? pVariants : [],
    });

    const renceng = p.rasioRencengPerDus || 0;
    const pcs = p.rasioPcsPerRenceng || 0;
    const subUnitType = (p.rasioRencengPerDus && p.rasioRencengPerDus > 0) ? 'renceng' : 'pcs';
    const directPcsVal = p.tierConfig?.tier3Ratio || 0;
    const totalPerDusVal = subUnitType === 'renceng' ? (renceng * pcs) : directPcsVal;
    const totalBoxes = totalPerDusVal > 0 ? Math.floor((p.stock || 0) / totalPerDusVal) : 0;
    const boxVariants = pVariants.map((v) => {
      const u = (v.name || '').toUpperCase().trim();
      let displayQty = v.ratioToBase || 1;
      if (u === 'DUS' && totalPerDusVal > 0 && v.ratioToBase >= totalPerDusVal) {
        displayQty = Math.round(v.ratioToBase / totalPerDusVal);
      } else if (u === 'RENCENG' && pcs > 0 && v.ratioToBase >= pcs) {
        displayQty = Math.round(v.ratioToBase / pcs);
      }
      return {
        ...v,
        ratioToBase: Math.max(1, displayQty),
      };
    });

    setBoxFormState({
      boxSubUnitType: subUnitType,
      rasioRencengPerDus: renceng,
      rasioPcsPerRenceng: pcs,
      rasioPcsPerDus: directPcsVal,
      totalBoxes: initialType === 'box' ? totalBoxes : 0,
      totalPurchaseCost: initialType === 'box' ? (p.totalPurchaseCost || Math.round((p.stock || 0) * (p.costBase || 0))) : 0,
      costBase: initialType === 'box' ? (p.costBase || 0) : 0,
      priceBase: initialType === 'box' ? (p.priceBase || p.hargaJualPcs || 0) : 0,
      hargaJualDus: initialType === 'box' ? (p.hargaJualDus || 0) : 0,
      hargaJualRenceng: initialType === 'box' ? (p.hargaJualRenceng || 0) : 0,
      hargaJualPcs: initialType === 'box' ? (p.hargaJualPcs || p.priceBase || 0) : 0,
      packagingVariants: initialType === 'box' ? boxVariants : [],
    });

    // Populate PCS state
    setPcsFormState({
      baseUnit: (p.baseUnit as UnitType) || 'pcs',
      stock: initialType === 'pcs' ? (p.stock || 0) : 0,
      totalPurchaseCost: initialType === 'pcs' ? (p.totalPurchaseCost || Math.round((p.stock || 0) * (p.costBase || 0))) : 0,
      costBase: initialType === 'pcs' ? (p.costBase || 0) : 0,
      priceBase: initialType === 'pcs' ? (p.priceBase || 0) : 0,
      packagingVariants: initialType === 'pcs' ? pVariants : [],
    });

    // Populate Liter state
    setLiterFormState({
      baseUnit: (p.baseUnit as UnitType) || 'liter',
      stock: initialType === 'liter' ? (p.stock || 0) : 0,
      totalPurchaseCost: initialType === 'liter' ? (p.totalPurchaseCost || Math.round((p.stock || 0) * (p.costBase || 0))) : 0,
      costBase: initialType === 'liter' ? (p.costBase || 0) : 0,
      priceBase: initialType === 'liter' ? (p.priceBase || 0) : 0,
      packagingVariants: initialType === 'liter' ? pVariants : [],
    });

    setIsEditModalOpen(true);
  };

  // Switch Product Type Tabs (Clean tab isolation - does NOT overwrite other tabs)
  const handleSelectProductType = (type: 'kg' | 'box' | 'pcs' | 'liter') => {
    setProductType(type);
  };

  // Generate SKU Code Automatically
  const handleGenerateAutoSku = () => {
    const nextNum = products.length + 1;
    const newSku = `BRG-${nextNum.toString().padStart(3, '0')}`;
    setFormCommon((prev) => ({
      ...prev,
      code: newSku,
    }));
  };

  const handleSaveProductForm = () => {
    if (!formCommon.name || !formCommon.name.trim() || !formCommon.code || !formCommon.code.trim()) {
      setFormError('Nama produk dan Kode Barang (SKU) wajib diisi.');
      return;
    }
    setFormError(null);

    let prodToSave: Product;

    if (productType === 'kg') {
      const variants = kgFormState.packagingVariants || [];
      let pBase = Number(kgFormState.priceBase || kgFormState.hargaJualKg || 0);
      if (pBase <= 0 && variants.length > 0) {
        const oneKgVar = variants.find(v => Math.abs(v.ratioToBase - 1) < 0.0001 || v.name.toLowerCase().includes('1 kg'));
        if (oneKgVar && oneKgVar.sellingPrice > 0) {
          pBase = oneKgVar.sellingPrice;
        } else {
          const first = variants[0];
          if (first && first.ratioToBase > 0 && first.sellingPrice > 0) {
            pBase = Math.round(first.sellingPrice / first.ratioToBase);
          }
        }
      }
      const hargaJualKgFinal = Number(kgFormState.hargaJualKg || pBase || 0);

      prodToSave = {
        id: formCommon.id || `prod-${Date.now()}`,
        code: formCommon.code.trim(),
        name: formCommon.name.trim(),
        category: formCommon.category,
        productType: 'kg',
        baseUnit: 'kg',
        isWeighable: true,
        stock: Number(kgFormState.stock || 0),
        minStockAlert: Number(formCommon.minStockAlert || 5),
        costBase: Number(kgFormState.costBase || 0),
        totalPurchaseCost: Number(kgFormState.totalPurchaseCost || 0),
        priceBase: pBase,
        hargaJualKg: hargaJualKgFinal,
        hargaJualGram500: kgFormState.hargaJualGram500,
        hargaJualGram250: kgFormState.hargaJualGram250,
        hargaJualGram100: kgFormState.hargaJualGram100,
        enableSubVariants: formCommon.enableSubVariants,
        packagingVariants: variants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;
    } else if (productType === 'box') {
      const isRencengMode = boxFormState.boxSubUnitType === 'renceng';
      const renceng = isRencengMode ? Math.max(0, Number(boxFormState.rasioRencengPerDus) || 0) : 0;
      const pcs = isRencengMode 
        ? Math.max(0, Number(boxFormState.rasioPcsPerRenceng) || 0) 
        : Math.max(0, Number(boxFormState.rasioPcsPerDus) || 0);
      const totalPerDus = isRencengMode ? (renceng * pcs) : pcs;
      const totalBoxes = Math.max(0, Number(boxFormState.totalBoxes) || 0);
      const totalPcs = totalBoxes * totalPerDus;
      const totalCost = Math.max(0, Number(boxFormState.totalPurchaseCost) || 0);
      const costPerPcs = totalPcs > 0 && totalCost > 0 ? Math.round(totalCost / totalPcs) : Number(boxFormState.costBase || 0);
      const boxCost = totalBoxes > 0 && totalCost > 0 ? Math.round(totalCost / totalBoxes) : (costPerPcs * totalPerDus);
      const pcsPerRenceng = isRencengMode ? pcs : 0;
      const costPerRenceng = isRencengMode && pcsPerRenceng > 0 ? (costPerPcs * pcsPerRenceng) : 0;
      const pricePcs = Number(boxFormState.priceBase || boxFormState.hargaJualPcs || 0);

      const variants = boxFormState.packagingVariants || [];
      let hargaJualDus = boxFormState.hargaJualDus;
      let hargaJualRenceng = boxFormState.hargaJualRenceng;
      let hargaJualPcs = boxFormState.hargaJualPcs || pricePcs;

      if (variants.length > 0) {
        const dusVar = variants.find((v) => v.name.toLowerCase().trim() === 'dus' || v.name.toLowerCase().includes('dus') || v.name.toLowerCase().includes('box'));
        const rencengVar = variants.find((v) => v.name.toLowerCase().trim() === 'renceng' || v.name.toLowerCase().includes('renceng') || v.name.toLowerCase().includes('renteng'));
        const pcsVar = variants.find((v) => v.name.toLowerCase().trim() === 'pcs' || v.ratioToBase === 1);

        if (dusVar && dusVar.sellingPrice > 0) hargaJualDus = dusVar.sellingPrice;
        if (rencengVar && rencengVar.sellingPrice > 0) hargaJualRenceng = rencengVar.sellingPrice;
        if (pcsVar && pcsVar.sellingPrice > 0) hargaJualPcs = pcsVar.sellingPrice;
      }

      const sanitizedBoxVariants = variants.map((v) => {
        const u = (v.name || '').toUpperCase().trim();
        const qty = Math.max(1, Number(v.ratioToBase) || 1);
        let unitCost = 0;
        let pcsRatio = qty;

        if (u === 'DUS' || u.includes('DUS') || u.includes('BOX') || u.includes('KARTON')) {
          unitCost = boxCost > 0 ? boxCost : (totalPerDus > 0 ? costPerPcs * totalPerDus : costPerPcs);
          pcsRatio = totalPerDus > 0 ? qty * totalPerDus : qty;
        } else if (u === 'RENCENG' || u.includes('RENCENG') || u.includes('RENTENG')) {
          unitCost = costPerRenceng > 0 ? costPerRenceng : (pcsPerRenceng > 0 ? costPerPcs * pcsPerRenceng : costPerPcs);
          pcsRatio = pcsPerRenceng > 0 ? qty * pcsPerRenceng : qty;
        } else if (u === 'PCS' || u.includes('PCS') || u.includes('BIJI') || u.includes('BUAH')) {
          unitCost = costPerPcs;
          pcsRatio = qty;
        } else if (u === 'PACK 6') {
          unitCost = costPerPcs * 6;
          pcsRatio = qty * 6;
        } else if (u === 'PACK 12' || u.includes('LUSIN')) {
          unitCost = costPerPcs * 12;
          pcsRatio = qty * 12;
        } else if (u === 'PACK 24' || u.includes('KODI')) {
          unitCost = costPerPcs * 24;
          pcsRatio = qty * 24;
        } else {
          unitCost = costPerPcs;
          pcsRatio = qty;
        }

        const cPrice = qty * unitCost;

        return {
          ...v,
          ratioToBase: pcsRatio,
          costPrice: cPrice,
        };
      });

      prodToSave = {
        id: formCommon.id || `prod-${Date.now()}`,
        code: formCommon.code.trim(),
        name: formCommon.name.trim(),
        category: formCommon.category,
        productType: 'box',
        baseUnit: 'pcs',
        isWeighable: false,
        stock: totalPcs,
        minStockAlert: Number(formCommon.minStockAlert || 0),
        costBase: costPerPcs,
        totalPurchaseCost: totalCost,
        priceBase: hargaJualPcs,
        hargaJualDus,
        hargaJualRenceng,
        hargaJualPcs,
        rasioRencengPerDus: renceng,
        rasioPcsPerRenceng: isRencengMode ? pcs : 0,
        enableSubVariants: formCommon.enableSubVariants,
        packagingVariants: sanitizedBoxVariants,
        tierConfig: {
          baseUnit: 'pcs',
          tier3Name: 'dus',
          tier3Ratio: totalPerDus,
          costTier3: boxCost,
          ...(isRencengMode ? {
            tier2Name: 'renceng',
            tier2Ratio: pcs,
            costTier2: costPerPcs * pcs,
          } : {}),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;
    } else if (productType === 'liter') {
      let pBase = Number(literFormState.priceBase || 0);
      if (pBase <= 0 && literFormState.packagingVariants && literFormState.packagingVariants.length > 0) {
        pBase = literFormState.packagingVariants[0].sellingPrice || 0;
      }
      prodToSave = {
        id: formCommon.id || `prod-${Date.now()}`,
        code: formCommon.code.trim(),
        name: formCommon.name.trim(),
        category: formCommon.category,
        productType: 'liter',
        baseUnit: literFormState.baseUnit || 'liter',
        isWeighable: false,
        stock: Number(literFormState.stock || 0),
        minStockAlert: Number(formCommon.minStockAlert || 0),
        costBase: Number(literFormState.costBase || 0),
        totalPurchaseCost: Number(literFormState.totalPurchaseCost || 0),
        priceBase: pBase,
        enableSubVariants: formCommon.enableSubVariants,
        packagingVariants: literFormState.packagingVariants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;
    } else {
      // PCS / Retail
      const pBase = Number(pcsFormState.priceBase || 0);
      prodToSave = {
        id: formCommon.id || `prod-${Date.now()}`,
        code: formCommon.code.trim(),
        name: formCommon.name.trim(),
        category: formCommon.category,
        productType: 'pcs',
        baseUnit: pcsFormState.baseUnit || 'pcs',
        isWeighable: false,
        stock: Number(pcsFormState.stock || 0),
        minStockAlert: Number(formCommon.minStockAlert || 0),
        costBase: Number(pcsFormState.costBase || 0),
        totalPurchaseCost: Number(pcsFormState.totalPurchaseCost || 0),
        priceBase: pBase,
        enableSubVariants: formCommon.enableSubVariants,
        packagingVariants: pcsFormState.packagingVariants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;
    }

    saveProduct(prodToSave);
    setIsEditModalOpen(false);
    showToast(`Data produk "${prodToSave.name}" berhasil disimpan!`);
  };



  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4 pb-24 lg:pb-6">
      
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* Top Header Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Manajemen Stok Sembako
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Sinkronisasi stok & multi-satuan otomatis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle between inventory table and stock flow logs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Katalog Stok
            </button>
            <button
              onClick={() => setActiveTab('stock_logs')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'stock_logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log Stok</span>
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAddProduct}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Search & Category Filter Controls */}
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari barang atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-600 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-600 outline-none focus:border-emerald-500"
              >
                <option value="all">Status Stok</option>
                <option value="low">Menipis</option>
                <option value="out">Habis</option>
              </select>
            </div>
          </div>

          {/* Product Inventory Table (Responsive & Compact) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[8px] sm:text-[9px]">
                  <tr>
                    <th className="py-2 px-3 sm:px-4">Barang & SKU</th>
                    <th className="py-2 px-2 sm:px-3">Kategori</th>
                    <th className="py-2 px-2 sm:px-3">Satuan & Varian</th>
                    <th className="py-2 px-2 sm:px-3">Sisa Stok</th>
                    <th className="py-2 px-2 sm:px-3">HPP Modal</th>
                    <th className="py-2 px-2 sm:px-3">Harga Jual</th>
                    <th className="py-2 px-3 sm:px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minStockAlert && p.stock > 0;
                    const isOut = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        {/* Name & SKU with Product Type Badge */}
                        <td className="py-2 sm:py-2.5 px-3 sm:px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] sm:text-xs">
                            <span className="line-clamp-1">{p.name}</span>
                            {p.isWeighable && (
                              <span title="Barang Timbangan">
                                <Scale className="w-3 h-3 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[9px] text-slate-400 font-bold tracking-tight">{p.code}</span>
                            <span className={`text-[8px] font-black px-1 py-0.2 rounded border ${
                              (p.baseUnit === 'kg' || p.isWeighable) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              (p.rasioRencengPerDus || p.productType === 'box') ? 'bg-amber-50 text-amber-800 border-amber-100' :
                              p.baseUnit === 'liter' ? 'bg-cyan-50 text-cyan-800 border-cyan-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                            }`}>
                              {(p.baseUnit === 'kg' || p.isWeighable) ? 'KG' : (p.rasioRencengPerDus || p.productType === 'box') ? 'BOX' : p.baseUnit === 'liter' ? 'LIT' : 'PCS'}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {p.category}
                          </span>
                        </td>

                        {/* Multi-Tier Units & Packaging Variants Info */}
                        <td className="py-3.5 px-3">
                          {p.packagingVariants && p.packagingVariants.length > 0 ? (
                            <div className="space-y-1 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                  Base: <strong className="uppercase">{p.baseUnit}</strong>
                                </span>
                                <span className="text-[10px] text-slate-400">&bull; {p.packagingVariants.length} Varian</span>
                              </div>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {p.packagingVariants.map((v, vIdx) => (
                                  <span
                                    key={v.id || vIdx}
                                    className="bg-amber-50/90 text-amber-900 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded font-bold"
                                    title={`1 ${v.name} = ${v.ratioToBase} ${p.baseUnit}`}
                                  >
                                    {v.name} {v.ratioToBase > 1 ? `(${v.ratioToBase} ${p.baseUnit})` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : p.rasioRencengPerDus && p.rasioPcsPerRenceng ? (
                            <div className="space-y-1">
                              <div className="font-extrabold text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300 text-[10px] inline-block shadow-2xs">
                                1 Dus = {p.rasioRencengPerDus} Renceng = {p.rasioRencengPerDus * p.rasioPcsPerRenceng} Pcs
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Dus</span>
                                <span>➔</span>
                                <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">Renceng</span>
                                <span>➔</span>
                                <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">Pcs</span>
                              </div>
                            </div>
                          ) : (p.baseUnit === 'kg' || p.isWeighable || p.hargaJualKg) ? (
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-emerald-950 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 text-[10px] inline-block">
                                1 KG = 1.000 Gram
                              </div>
                              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-600 font-bold">
                                <span className="bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded border border-emerald-200">1KG</span>
                                <span className="bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-200">500g</span>
                                <span className="bg-blue-50 text-blue-800 px-1 py-0.2 rounded border border-blue-200">250g</span>
                              </div>
                            </div>
                          ) : p.baseUnit === 'liter' ? (
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-cyan-950 bg-cyan-100/90 px-2 py-0.5 rounded-md border border-cyan-300 text-[10px] inline-block">
                                1 Liter = 1.000 ml
                              </div>
                              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-600 font-bold">
                                <span className="bg-cyan-50 text-cyan-800 px-1 py-0.2 rounded border border-cyan-200">1L</span>
                                <span className="bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-200">500ml</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5 text-[11px]">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                1 {p.baseUnit}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          <div className="space-y-0.5">
                            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                              isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {p.stock.toLocaleString('id-ID')} {p.baseUnit}
                            </span>
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          <div className="text-[10px] font-bold text-slate-700">Rp {p.costBase.toLocaleString('id-ID')}</div>
                          <div className="text-[8px] text-slate-400 font-medium uppercase">/ {p.baseUnit}</div>
                        </td>

                        {/* Harga Jual (Compact Pills) */}
                        <td className="py-2 px-3">
                          {p.packagingVariants && p.packagingVariants.length > 0 ? (
                            <div className="space-y-1">
                              {p.packagingVariants.slice(0, 3).map((v, vIdx) => {
                                const pillBg = vIdx === 0 
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-100' 
                                  : vIdx === 1 
                                  ? 'bg-amber-50 text-amber-900 border-amber-100' 
                                  : 'bg-blue-50 text-blue-900 border-blue-100';

                                return (
                                  <div key={v.id || vIdx} className={`flex items-center justify-between gap-1 px-1.5 py-0.2 rounded border ${pillBg} text-[10px] font-bold`}>
                                    <span className="truncate max-w-[50px]">{v.name}:</span>
                                    <span>Rp{v.sellingPrice.toLocaleString('id-ID')}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : p.rasioRencengPerDus && p.rasioPcsPerRenceng ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1 px-1.5 py-0.2 rounded border bg-emerald-50 text-emerald-900 border-emerald-100 text-[10px] font-bold">
                                <span>Dus:</span>
                                <span>Rp{(p.hargaJualDus || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1 px-1.5 py-0.2 rounded border bg-amber-50 text-amber-900 border-amber-100 text-[10px] font-bold">
                                <span>Ren:</span>
                                <span>Rp{(p.hargaJualRenceng || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1 px-1.5 py-0.2 rounded border bg-blue-50 text-blue-900 border-blue-100 text-[10px] font-bold">
                                <span>Pcs:</span>
                                <span>Rp{(p.hargaJualPcs || p.priceBase).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 text-emerald-900 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-black inline-block">
                              Rp{(p.priceBase).toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>

                        {/* Aksi (Icon-only Buttons) */}
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenRestock(p)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                              title="Restok Barang"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                              title="Edit Data"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setDeletingProductTarget(p)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* AUDIT STOCK LOGS TAB */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Perubahan Stok (Audit Logs)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Total {stockLogs.length} Entri Catatan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-3">Kode &amp; Nama Barang</th>
                  <th className="py-2.5 px-3">Jenis Transaksi</th>
                  <th className="py-2.5 px-3">Jumlah Masuk/Keluar</th>
                  <th className="py-2.5 px-3">Perubahan Stok</th>
                  <th className="py-2.5 px-3">Harga Beli &amp; HPP (Audit Keuangan)</th>
                  <th className="py-2.5 px-4">Catatan Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {stockLogs.map((log) => {
                  const isAdd = log.baseQuantityChange > 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{log.productName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{log.productCode}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'RESTOK_MASUK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.type === 'PENJUALAN_POS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.type === 'RESTOK_MASUK' ? 'Restok Masuk' : log.type === 'PENJUALAN_POS' ? 'Penjualan Kasir' : 'Penyesuaian'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                        {log.originalQuantity} {log.originalUnit}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-black px-2 py-0.5 rounded ${
                            isAdd ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isAdd ? `+${log.baseQuantityChange}` : log.baseQuantityChange} {log.baseUnit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {log.type === 'RESTOK_MASUK' && (log.unitCost !== undefined || log.totalCost !== undefined) ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800">
                              Rp {(log.unitCost || 0).toLocaleString('id-ID')} <span className="text-[10px] text-slate-500 font-normal">/ {log.originalUnit}</span>
                            </div>
                            <div className="text-[10px] text-emerald-800 font-bold">
                              Faktur: Rp {(log.totalCost || 0).toLocaleString('id-ID')}
                            </div>
                            {log.newHppBase !== undefined && (
                              <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono pt-0.5">
                                <span>HPP: Rp {(log.oldHppBase || 0).toLocaleString('id-ID')} ➔ <strong>Rp {log.newHppBase.toLocaleString('id-ID')}</strong></span>
                                <span className={`px-1 rounded text-[8px] font-bold ${
                                  log.hppMethod === 'last_price' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {log.hppMethod === 'last_price' ? 'Terakhir' : 'Rata2'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : log.type === 'PENJUALAN_POS' ? (
                          <span className="text-[10px] text-slate-400 font-medium">Transaksi Kasir</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 italic">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL WITH WEIGHTED AVERAGE & LAST PRICE HPP ENGINE */}
      {restockProductTarget && (() => {
        const product = restockProductTarget;
        const availableUnits = storage.getAvailableUnitsForProduct(product);
        const matchedUnit = availableUnits.find((u) => u.unit.toLowerCase() === restockUnit.toLowerCase()) || availableUnits[0] || {
          unit: product.baseUnit,
          ratio: 1,
          price: product.priceBase || 0,
          cost: product.costBase || 0,
          label: product.baseUnit,
        };

        const unitRatio = matchedUnit.ratio > 0 ? matchedUnit.ratio : 1;
        const safeQty = Math.max(0, Number(restockQty) || 0);
        const baseAdded = Math.round((safeQty * unitRatio) * 10000) / 10000;
        const currentStock = Math.max(0, Number(product.stock) || 0);
        const newStock = Math.round((product.stock + baseAdded) * 10000) / 10000;
        
        const currentHppBase = Math.max(0, Number(product.costBase) || 0);
        const supplierCost = Math.max(0, Number(restockCost) || 0);
        const supplierBaseCost = unitRatio > 0 ? supplierCost / unitRatio : supplierCost;
        const totalInvoice = Math.round(safeQty * supplierCost);

        // Calculate simulated HPP
        let simulatedHppBase = currentHppBase;
        if (supplierCost > 0) {
          if (restockHppMethod === 'last_price' || currentStock <= 0) {
            simulatedHppBase = Math.round(supplierBaseCost);
          } else {
            const oldAssetValue = currentStock * currentHppBase;
            const newBatchValue = baseAdded * supplierBaseCost;
            const totalBaseUnits = currentStock + baseAdded;
            simulatedHppBase = totalBaseUnits > 0 
              ? Math.round((oldAssetValue + newBatchValue) / totalBaseUnits) 
              : Math.round(supplierBaseCost);
          }
        }

        const hppDiff = simulatedHppBase - currentHppBase;
        const hppDiffPct = currentHppBase > 0 ? ((hppDiff / currentHppBase) * 100).toFixed(1) : '0';

        // Detect product unit family for breakdowns
        const isBoxType = Boolean(product.rasioRencengPerDus && product.rasioPcsPerRenceng) || 
          product.tierConfig?.tier3Name === 'dus' || 
          product.baseUnit === 'dus' || 
          (product.packagingVariants?.some(v => v.name.toLowerCase().includes('dus')));

        const rencengPerDus = product.rasioRencengPerDus || 0;
        const pcsPerRenceng = product.rasioPcsPerRenceng || 0;
        const totalPerDus = rencengPerDus * pcsPerRenceng;

        const isKgType = product.isWeighable || product.baseUnit === 'kg' || Boolean(product.hargaJualKg);
        const isLiterType = product.baseUnit === 'liter';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] my-auto animate-in fade-in zoom-in-95">
              
              {/* MODAL HEADER */}
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                    <PackagePlus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">Restok Barang &amp; Update HPP</h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {product.name} &bull; <span className="font-mono text-emerald-400">{product.code}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRestockProductTarget(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {/* MODAL BODY (SCROLLABLE & COMPACT) */}
              <div className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
                
                {/* Product Snapshot Info Card */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Stok Master Saat Ini</span>
                    <span className="font-black text-sm text-slate-900">
                      {formatNumberWithDots(product.stock, isKgType || isLiterType)} {product.baseUnit}
                    </span>
                  </div>
                  <div className="text-right sm:text-left">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">HPP Modal Master</span>
                    <span className="font-black text-sm text-emerald-800">
                      Rp {currentHppBase.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Restock Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase tracking-tight">Satuan Masuk:</label>
                    <select
                      value={restockUnit}
                      onChange={(e) => {
                        const selected = e.target.value;
                        setRestockUnit(selected);
                        const matched = availableUnits.find((u) => u.unit === selected);
                        if (matched) setRestockCost(matched.cost);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-[11px] focus:bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {availableUnits.map((u, uIdx) => (
                        <option key={`${u.variantId || u.unit}-${uIdx}`} value={u.unit}>
                          {u.unit} ({u.ratio} {product.baseUnit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase tracking-tight">Jumlah ({restockUnit}):</label>
                    <input
                      type="number"
                      value={restockQty}
                      onChange={(e) => setRestockQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-black text-[11px] text-center focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Supplier Purchase Cost */}
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 space-y-1">
                  <label className="text-[10px] font-bold text-emerald-900 block uppercase">Harga Beli Baru per {restockUnit}:</label>
                  <FormattedNumberInput
                    value={restockCost}
                    onChange={(val) => setRestockCost(val)}
                    prefix="Rp"
                    className="bg-white font-black text-slate-900 text-xs"
                  />
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 pt-1">
                    <span className="uppercase text-[9px] tracking-tight">Total Nilai Faktur:</span>
                    <span>Rp {totalInvoice.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* HPP Method Selection - Compact Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Metode Pembaruan HPP:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestockHppMethod('weighted_average')}
                      className={`p-2 rounded-xl border-2 text-left transition ${
                        restockHppMethod === 'weighted_average' ? 'border-emerald-500 bg-emerald-50 shadow-xs' : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="font-black text-[10px] text-slate-900">Rata-Rata (AVCO)</div>
                      <p className="text-[9px] text-slate-500 leading-tight">Menyeimbangkan harga lama & baru</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestockHppMethod('last_price')}
                      className={`p-2 rounded-xl border-2 text-left transition ${
                        restockHppMethod === 'last_price' ? 'border-emerald-500 bg-emerald-50 shadow-xs' : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="font-black text-[10px] text-slate-900">Harga Terakhir</div>
                      <p className="text-[9px] text-slate-500 leading-tight">Langsung ikuti harga faktur baru</p>
                    </button>
                  </div>
                </div>

                {/* LIVE SIMULATION BOX - DARK THEME */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>SIMULASI STOK & HPP BARU:</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="space-y-1">
                      <span className="text-slate-400 block uppercase">Estimasi HPP Dasar Baru:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-400 text-sm">Rp {simulatedHppBase.toLocaleString('id-ID')}</span>
                        <span className="text-[9px] text-slate-500 line-through">Rp {currentHppBase.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-slate-400 block uppercase">Proyeksi Sisa Stok:</span>
                      <div className="font-black text-white text-xs">
                        {formatNumberWithDots(newStock, isKgType || isLiterType)} {product.baseUnit}
                      </div>
                    </div>
                  </div>

                  {/* Pecahan HPP Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/50 mt-1">
                    {isKgType ? (
                      <>
                        <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                          <span className="text-[9px] text-slate-500 block">500g:</span>
                          <span className="font-bold text-white">Rp {Math.round(simulatedHppBase * 0.5).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                          <span className="text-[9px] text-slate-500 block">250g:</span>
                          <span className="font-bold text-white">Rp {Math.round(simulatedHppBase * 0.25).toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    ) : isBoxType ? (
                      <>
                        <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                          <span className="text-[9px] text-slate-500 block">1 Dus:</span>
                          <span className="font-bold text-white">Rp {Math.round(simulatedHppBase * totalPerDus).toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* SINKRON HARGA JUAL */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[10px]">
                      <Coins className="w-3.5 h-3.5" />
                      <span>SINKRON HARGA JUAL KASIR:</span>
                    </div>
                    <div className="flex gap-1">
                      {[10, 15, 20].map(pct => (
                        <button key={pct} type="button" onClick={() => {
                          if (isKgType) {
                            setRestockHargaJualKg(Math.round((simulatedHppBase * (1 + pct/100)) / 100) * 100);
                            setRestockHargaJualGram500(Math.round((simulatedHppBase * 0.5 * (1 + pct/100)) / 100) * 100);
                          } else if (isBoxType) {
                            setRestockHargaJualPcs(Math.round((simulatedHppBase * (1 + (pct+10)/100)) / 50) * 50);
                            setRestockHargaJualDus(Math.round((simulatedHppBase * totalPerDus * (1 + pct/100)) / 500) * 500);
                          } else {
                            setRestockPriceBase(Math.round((simulatedHppBase * (1 + pct/100)) / 50) * 50);
                          }
                        }} className="px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded">+{pct}%</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {isKgType ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-amber-800 uppercase">Harga 1 KG:</label>
                          <FormattedNumberInput value={restockHargaJualKg} onChange={setRestockHargaJualKg} prefix="Rp" className="bg-white text-xs font-black" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-amber-800 uppercase">Harga 500g:</label>
                          <FormattedNumberInput value={restockHargaJualGram500} onChange={setRestockHargaJualGram500} prefix="Rp" className="bg-white text-xs font-black" />
                        </div>
                      </>
                    ) : isBoxType ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-amber-800 uppercase">Harga 1 Dus:</label>
                          <FormattedNumberInput value={restockHargaJualDus} onChange={setRestockHargaJualDus} prefix="Rp" className="bg-white text-xs font-black" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-amber-800 uppercase">Harga 1 Pcs:</label>
                          <FormattedNumberInput value={restockHargaJualPcs} onChange={setRestockHargaJualPcs} prefix="Rp" className="bg-white text-xs font-black" />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-amber-800 uppercase">Harga Jual per {product.baseUnit}:</label>
                        <FormattedNumberInput value={restockPriceBase} onChange={setRestockPriceBase} prefix="Rp" className="bg-white text-xs font-black" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Petty Cash Option */}
                <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="recordPettyCash"
                    checked={restockRecordPettyCash}
                    onChange={(e) => setRestockRecordPettyCash(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 h-3.5 w-3.5"
                  />
                  <label htmlFor="recordPettyCash" className="text-[10px] text-slate-600 font-medium cursor-pointer">
                    <span className="font-bold text-slate-900 block">Catat Pengeluaran Kas Toko Otomatis</span>
                    Nilai Rp {totalInvoice.toLocaleString('id-ID')} akan dipotong dari saldo kas harian kasir.
                  </label>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Catatan / Faktur Supplier:</label>
                  <input
                    type="text"
                    value={restockNotes}
                    onChange={(e) => setRestockNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:bg-white outline-none"
                    placeholder="Contoh: Faktur #123 Supplier Makmur"
                  />
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setRestockProductTarget(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRestock}
                  disabled={safeQty <= 0}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Restok</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* REVAMPED INPUT / EDIT PRODUCT DATA MODAL FORM */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* MODAL CONTENT - SCROLLABLE & COMPACT GRID */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Form Error Banner */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-[11px]">{formError}</span>
                </div>
              )}

              {/* STEP 1: UNIT TYPE SELECTION (If not selected) */}
              {productType === null ? (
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Pilih Tipe Satuan Utama:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleSelectProductType('kg')} className="p-3 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 text-left transition space-y-1">
                      <Scale className="w-5 h-5 text-emerald-600" />
                      <div className="font-black text-xs">KG / TIMBANGAN</div>
                      <p className="text-[10px] text-slate-500">Beras curah, Telur, Gula</p>
                    </button>
                    <button type="button" onClick={() => handleSelectProductType('box')} className="p-3 rounded-xl border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50 text-left transition space-y-1">
                      <Boxes className="w-5 h-5 text-amber-600" />
                      <div className="font-black text-xs">BOX / GROSIR</div>
                      <p className="text-[10px] text-slate-500">Indomie Dus, Kopi Renceng</p>
                    </button>
                    <button type="button" onClick={() => handleSelectProductType('pcs')} className="p-3 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-left transition space-y-1">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div className="font-black text-xs">PCS / RETAIL</div>
                      <p className="text-[10px] text-slate-500">Sabun, Snack, Sachet</p>
                    </button>
                    <button type="button" onClick={() => handleSelectProductType('liter')} className="p-3 rounded-xl border-2 border-slate-100 hover:border-cyan-500 hover:bg-cyan-50 text-left transition space-y-1">
                      <Droplets className="w-5 h-5 text-cyan-600" />
                      <div className="font-black text-xs">LITER / CAIR</div>
                      <p className="text-[10px] text-slate-500">Minyak Botol, Sirup</p>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Selected Unit Header */}
                  <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-bold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SATUAN: <span className="uppercase text-emerald-400">{productType}</span></span>
                    </div>
                    <button type="button" onClick={() => setProductType(null)} className="text-slate-400 hover:text-white underline">Ubah Tipe</button>
                  </div>

                  {/* PRIMARY GRID - COMPACT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Kode SKU:</label>
                        <button type="button" onClick={handleGenerateAutoSku} className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-tighter">AUTO</button>
                      </div>
                      <input type="text" value={formCommon.code} onChange={(e) => setFormCommon({ ...formCommon, code: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs focus:bg-white" required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Kategori:</label>
                      <select value={formCommon.category} onChange={(e) => setFormCommon({ ...formCommon, category: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:bg-white">
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nama Produk:</label>
                      <input type="text" value={formCommon.name} onChange={(e) => setFormCommon({ ...formCommon, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:bg-white" placeholder="Nama barang..." required />
                    </div>
                  </div>

              {/* UNIVERSAL OPTIONAL SUB-VARIANTS TOGGLE */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    formCommon.enableSubVariants ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="enableSubVariantsToggle" className="font-extrabold text-slate-900 text-xs block cursor-pointer">
                      [ ] Aktifkan Varian / Pecahan Turunan (Opsional)
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formCommon.enableSubVariants 
                        ? 'Aktif: Menampilkan tombol pilihan harga pecahan (gram, renceng, 500ml, varian kemasan) di menu kasir.'
                        : 'Non-aktif: Produk hanya dijual dalam 1 satuan utama (tanpa tombol pecahan di kasir).'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    id="enableSubVariantsToggle"
                    checked={formCommon.enableSubVariants}
                    onChange={(e) => setFormCommon({ ...formCommon, enableSubVariants: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* FLOW A: KG / WEIGHT FORM (BARANG TIMBANGAN) */}
              {productType === 'kg' && (() => {
                const stockKg = Number(kgFormState.stock || 0);
                const totalCost = Number(kgFormState.totalPurchaseCost || 0);
                const costPerKg = Number(kgFormState.costBase || 0);
                const cost500g = Math.round(costPerKg * 0.5);
                const cost250g = Math.round(costPerKg * 0.25);
                const cost100g = Math.round(costPerKg * 0.1);
                const cost1g = costPerKg > 0 ? (costPerKg / 1000) : 0;
                const sellingPriceKg = Number(kgFormState.priceBase || kgFormState.hargaJualKg || 0);
                const profitPerKg = sellingPriceKg - costPerKg;
                const marginPctKg = sellingPriceKg > 0 ? Math.round((profitPerKg / sellingPriceKg) * 100) : 0;

                const applyMarginKg = (pct: number) => {
                  const targetPrice = Math.round((costPerKg * (1 + pct / 100)) / 100) * 100;
                  const target500 = Math.round((cost500g * (1 + pct / 100)) / 100) * 100;
                  const target250 = Math.round((cost250g * (1 + pct / 100)) / 100) * 100;
                  const target100 = Math.round((cost100g * (1 + (pct + 5) / 100)) / 50) * 50;
                  setKgFormState({
                    ...kgFormState,
                    priceBase: targetPrice,
                    hargaJualKg: targetPrice,
                    hargaJualGram500: target500,
                    hargaJualGram250: target250,
                    hargaJualGram100: target100,
                  });
                };

                const addKgVariantPreset = (ratio: number, defaultName: string) => {
                  const existing = kgFormState.packagingVariants || [];
                  let suggestedPrice = Math.round((sellingPriceKg * ratio) / 100) * 100;
                  if (suggestedPrice < 500) suggestedPrice = 1000;

                  const newVariant: RetailPackagingVariant = {
                    id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    name: defaultName,
                    ratioToBase: ratio,
                    unitLabel: 'Gram',
                    sellingPrice: suggestedPrice,
                    costPrice: Math.round(costPerKg * ratio),
                  };
                  setKgFormState({
                    ...kgFormState,
                    packagingVariants: [...existing, newVariant],
                  });
                };

                return (
                  <div className="space-y-4">
                    {/* INPUT SECTION: TOTAL STOK (KG) & TOTAL HARGA BELI (RP) */}
                    <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                          <Scale className="w-4 h-4 text-emerald-600" />
                          <span>1. Input Stok Masuk &amp; Total Belanja Modal (Faktur Beli):</span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          Base Unit: KG (Desimal Otomatis)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                        {/* 1. Total Stok Masuk (kg) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Total Stok Masuk (kg):
                          </label>
                          <FormattedNumberInput
                            value={stockKg}
                            onChange={(val) => {
                              const newStock = Math.max(0, val);
                              const newCost = totalCost > 0 && newStock > 0
                                ? Math.round(totalCost / newStock)
                                : costPerKg;
                              setKgFormState({
                                ...kgFormState,
                                stock: newStock,
                                costBase: newCost,
                              });
                            }}
                            allowDecimal={true}
                            suffix="kg"
                            placeholder=""
                            className="bg-white font-black text-slate-900"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Contoh: 50 kg untuk 1 karung beras.
                          </span>
                        </div>

                        {/* 2. Total Harga Beli (Rp) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Total Harga Beli Semua Stok:
                          </label>
                          <FormattedNumberInput
                            value={totalCost}
                            onChange={(val) => {
                              const newTotal = Math.max(0, val);
                              const newCost = stockKg > 0
                                ? Math.round(newTotal / stockKg)
                                : costPerKg;
                              setKgFormState({
                                ...kgFormState,
                                totalPurchaseCost: newTotal,
                                costBase: newCost,
                              });
                            }}
                            prefix="Rp"
                            placeholder=""
                            className="bg-white font-black text-slate-900"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Total nilai faktur kulakan grosir.
                          </span>
                        </div>

                        {/* 3. Harga Beli Modal per 1 kg (HPP / 1 kg) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            HPP Modal per 1 kg (Auto):
                          </label>
                          <FormattedNumberInput
                            value={costPerKg}
                            onChange={(val) => {
                              const newCost = Math.max(0, val);
                              const newTotal = stockKg > 0 ? Math.round(stockKg * newCost) : totalCost;
                              setKgFormState({
                                ...kgFormState,
                                costBase: newCost,
                                totalPurchaseCost: newTotal,
                              });
                            }}
                            prefix="Rp"
                            placeholder=""
                            className="bg-emerald-50 border-emerald-300 font-black text-emerald-950"
                          />
                          <span className="text-[10px] text-emerald-700 mt-1 block font-medium">
                            {stockKg > 0 && totalCost > 0 
                              ? `Rumus: Rp ${totalCost.toLocaleString('id-ID')} ÷ ${stockKg} kg` 
                              : 'Otomatis dihitung dari Total Beli ÷ Total kg'}
                          </span>
                        </div>
                      </div>
                    </div>



                    {/* PURE WEIGHABLE PACKAGING VARIANTS FOR KG */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                            <Package className="w-4 h-4 text-amber-600" />
                            <span>3. Varian Kemasan Eceran Timbangan (Siap Pakai di Kasir)</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Satuan eceran kemasan plastik/bungkus. Penjualan produk sepenuhnya bersumber dari varian custom di bawah ini.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newVariant: RetailPackagingVariant = {
                              id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                              name: 'Kemasan Custom',
                              ratioToBase: 0.25,
                              unitLabel: 'Gram',
                              sellingPrice: Math.round((costPerKg * 0.25 * 1.2) / 100) * 100 || 0,
                              costPrice: Math.round(costPerKg * 0.25),
                            };
                            setKgFormState({
                              ...kgFormState,
                              packagingVariants: [...(kgFormState.packagingVariants || []), newVariant],
                            });
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Varian Custom</span>
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">Preset Cepat:</span>
                        <button
                          type="button"
                          onClick={() => addKgVariantPreset(0.1, 'Kemasan 100g (1 Ons)')}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-2xs"
                        >
                          100g (1 Ons)
                        </button>
                        <button
                          type="button"
                          onClick={() => addKgVariantPreset(0.25, 'Kemasan 1/4 kg (250g)')}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-2xs"
                        >
                          1/4 kg (250g)
                        </button>
                        <button
                          type="button"
                          onClick={() => addKgVariantPreset(0.5, 'Kemasan 1/2 kg (500g)')}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-2xs"
                        >
                          1/2 kg (500g)
                        </button>
                        <button
                          type="button"
                          onClick={() => addKgVariantPreset(1.0, 'Kemasan 1 kg Pack')}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-2xs"
                        >
                          1 kg Pack
                        </button>
                      </div>

                      {/* KG Variant list table */}
                      {kgFormState.packagingVariants && kgFormState.packagingVariants.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {kgFormState.packagingVariants.map((variant, vIdx) => {
                            const variantHpp = costPerKg * (variant.ratioToBase || 0);
                            const profit = variant.sellingPrice - variantHpp;
                            const margin = variant.sellingPrice > 0 ? Math.round((profit / variant.sellingPrice) * 100) : 0;
                            const maxPacks = stockKg > 0 && variant.ratioToBase > 0 ? Math.floor(stockKg / variant.ratioToBase) : 0;

                            return (
                              <div
                                key={variant.id || vIdx}
                                className="bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center hover:border-amber-400 transition"
                              >
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nama Kemasan:</label>
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => {
                                      const updated = [...(kgFormState.packagingVariants || [])];
                                      updated[vIdx] = { ...updated[vIdx], name: e.target.value };
                                      setKgFormState({ ...kgFormState, packagingVariants: updated });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Berat (Gram):</label>
                                  <FormattedNumberInput
                                    value={Math.round((variant.ratioToBase || 0) * 1000)}
                                    onChange={(val) => {
                                      const updated = [...(kgFormState.packagingVariants || [])];
                                      const ratio = Math.max(0.001, val / 1000);
                                      updated[vIdx] = { 
                                        ...updated[vIdx], 
                                        ratioToBase: ratio,
                                        costPrice: Math.round(costPerKg * ratio)
                                      };
                                      setKgFormState({ ...kgFormState, packagingVariants: updated });
                                    }}
                                    className="bg-slate-50 font-bold"
                                  />
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    HPP: Rp {Math.round(variantHpp).toLocaleString('id-ID')} &bull; Stok: {maxPacks} bks
                                  </span>
                                </div>

                                <div className="sm:col-span-4">
                                  <label className="text-[10px] font-bold text-emerald-800 block mb-0.5">Harga Jual {variant.name ? variant.name : 'Varian'} (Rp):</label>
                                  <FormattedNumberInput
                                    value={variant.sellingPrice}
                                    onChange={(val) => {
                                      const updated = [...(kgFormState.packagingVariants || [])];
                                      updated[vIdx] = { ...updated[vIdx], sellingPrice: val };
                                      setKgFormState({ ...kgFormState, packagingVariants: updated });
                                    }}
                                    prefix="Rp"
                                    className="bg-white font-black text-emerald-900"
                                  />
                                  {variant.sellingPrice > 0 && costPerKg > 0 && (
                                    <span className={`text-[9px] font-bold block mt-0.5 ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                      {profit >= 0 
                                        ? `${variant.name ? variant.name : 'Varian'} Dijual: +Rp ${Math.round(profit).toLocaleString('id-ID')} (${margin}%)` 
                                        : `${variant.name ? variant.name : 'Varian'} Rugi: -Rp ${Math.round(Math.abs(profit)).toLocaleString('id-ID')}`}
                                    </span>
                                  )}
                                </div>

                                <div className="sm:col-span-1 flex justify-end sm:justify-center pt-2 sm:pt-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = kgFormState.packagingVariants?.filter((_, i) => i !== vIdx);
                                      setKgFormState({ ...kgFormState, packagingVariants: updated });
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                                    title="Hapus varian"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded-xl border border-dashed border-amber-300 text-center text-slate-500 text-[11px]">
                          Belum ada varian kemasan eceran. Klik salah satu tombol preset di atas atau tambah custom.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* FLOW B: BOX / WHOLESALE FORM (DUS & RENCENG/PCS GROSIR) */}
              {productType === 'box' && (() => {
                const isRencengMode = boxFormState.boxSubUnitType === 'renceng';
                const rencengPerDus = isRencengMode ? Math.max(0, Number(boxFormState.rasioRencengPerDus) || 0) : 0;
                const pcsPerRenceng = isRencengMode ? Math.max(0, Number(boxFormState.rasioPcsPerRenceng) || 0) : 0;
                const pcsPerDusDirect = isRencengMode ? 0 : Math.max(0, Number(boxFormState.rasioPcsPerDus) || 0);
                const totalPerDus = isRencengMode ? (rencengPerDus * pcsPerRenceng) : pcsPerDusDirect;
                const totalBoxes = Math.max(0, Number(boxFormState.totalBoxes) || 0);
                const totalCost = Math.max(0, Number(boxFormState.totalPurchaseCost) || 0);

                // Auto conversion calculations with strict NaN and Infinity guards
                const totalPcs = totalBoxes * totalPerDus;
                const costPerPcs = totalPcs > 0 && totalCost > 0 && !isNaN(totalCost / totalPcs)
                  ? Math.round(totalCost / totalPcs)
                  : Math.max(0, Number(boxFormState.costBase) || 0);
                const boxCost = totalBoxes > 0 && totalCost > 0 && !isNaN(totalCost / totalBoxes)
                  ? Math.round(totalCost / totalBoxes)
                  : (costPerPcs * totalPerDus);
                const costPerRenceng = isRencengMode && pcsPerRenceng > 0 
                  ? (costPerPcs * pcsPerRenceng) 
                  : 0;

                // Benchmark margin guidelines
                const suggestedBoxPrice = !isNaN(boxCost) && boxCost > 0 ? Math.round((boxCost * 1.1) / 500) * 500 : 0;
                const suggestedRencengPrice = isRencengMode && !isNaN(costPerRenceng) && costPerRenceng > 0 ? Math.round((costPerRenceng * 1.15) / 100) * 100 : 0;
                const suggestedPcsPrice = !isNaN(costPerPcs) && costPerPcs > 0 ? Math.round((costPerPcs * 1.25) / 50) * 50 : 0;

                const getUnitCostAndSuggested = (unitStr: string) => {
                  const upper = (unitStr || '').toUpperCase().trim();
                  let cost = costPerPcs;
                  let suggested = suggestedPcsPrice;

                  if (upper.includes('DUS') || upper.includes('BOX') || upper.includes('KARTON')) {
                    cost = boxCost > 0 ? boxCost : (totalPerDus > 0 ? costPerPcs * totalPerDus : costPerPcs);
                    suggested = suggestedBoxPrice;
                  } else if (upper.includes('RENCENG') || upper.includes('RENTENG')) {
                    cost = costPerRenceng > 0 ? costPerRenceng : (pcsPerRenceng > 0 ? costPerPcs * pcsPerRenceng : costPerPcs);
                    suggested = suggestedRencengPrice;
                  } else if (upper.includes('PACK 6')) {
                    cost = costPerPcs * 6;
                    suggested = suggestedPcsPrice * 6;
                  } else if (upper.includes('PACK 12') || upper.includes('LUSIN')) {
                    cost = costPerPcs * 12;
                    suggested = suggestedPcsPrice * 12;
                  } else if (upper.includes('PACK 24') || upper.includes('KODI')) {
                    cost = costPerPcs * 24;
                    suggested = suggestedPcsPrice * 24;
                  } else {
                    cost = costPerPcs;
                    suggested = suggestedPcsPrice;
                  }
                  return { unitCost: cost, unitSuggestedPrice: suggested };
                };

                const addCustomVariantRow = (name: string, ratio: number, price: number) => {
                  const rawUnit = (name || 'DUS').toUpperCase().trim();
                  const unitName = rawUnit || 'DUS';
                  const initialQty = ratio > 0 ? ratio : 1;
                  const { unitCost, unitSuggestedPrice } = getUnitCostAndSuggested(unitName);

                  const calculatedCost = initialQty * unitCost;
                  const initialPrice = price > 0 ? price : (initialQty * unitSuggestedPrice);

                  const newVariant: RetailPackagingVariant = {
                    id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    name: unitName,
                    ratioToBase: initialQty,
                    unitLabel: unitName,
                    sellingPrice: initialPrice,
                    costPrice: calculatedCost,
                  };
                  setBoxFormState({
                    ...boxFormState,
                    packagingVariants: [...(boxFormState.packagingVariants || []), newVariant],
                  });
                };

                return (
                  <div className="space-y-4">
                    {/* STEP 1: MULTI-TIER RATIOS & TOTAL PURCHASE COST */}
                    <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3">
                      <div className="font-bold text-amber-950 flex items-center justify-between">
                        <span className="text-xs font-black">Parameter Pembelian Grosir:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                        {/* 1. Total Dus */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Total Dus Masuk:
                          </label>
                          <FormattedNumberInput
                            value={totalBoxes}
                            onChange={(boxQty) => {
                              const validBoxes = Math.max(0, boxQty);
                              const newPcs = validBoxes * totalPerDus;
                              const newCostPcs = totalCost > 0 && newPcs > 0 ? Math.round(totalCost / newPcs) : costPerPcs;
                              
                              setBoxFormState({
                                ...boxFormState,
                                totalBoxes: validBoxes,
                                costBase: newCostPcs,
                              });
                            }}
                            suffix="Dus"
                            className="bg-white font-black text-amber-950"
                          />
                        </div>

                        {/* 2. Pilihan Tipe Kemasan Dus Dropdown */}
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Pilih Tipe Kemasan Dus:
                          </label>
                          <select
                            value={boxFormState.boxSubUnitType}
                            onChange={(e) => setBoxFormState({ ...boxFormState, boxSubUnitType: e.target.value as 'renceng' | 'pcs' })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-xs shadow-2xs"
                          >
                            <option value="renceng">DUS Renceng - Pcs (Default)</option>
                            <option value="pcs">DUS Pcs (Langsung ke Pcs)</option>
                          </select>
                        </div>

                        {/* 3. Total Harga Beli Semua Dus (Rp) */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Total Beli Semua Dus:
                          </label>
                          <FormattedNumberInput
                            value={totalCost}
                            onChange={(val) => {
                              const newTotal = Math.max(0, val);
                              const newCostPcs = totalPcs > 0 ? Math.round(newTotal / totalPcs) : 0;

                              setBoxFormState({
                                ...boxFormState,
                                totalPurchaseCost: newTotal,
                                costBase: newCostPcs,
                              });
                            }}
                            prefix="Rp"
                            className="bg-white font-black text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Conditional sub-inputs row */}
                      {isRencengMode ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                              Isi per Dus (Renceng):
                            </label>
                            <FormattedNumberInput
                              value={rencengPerDus}
                              onChange={(rRenceng) => {
                                const validRenceng = Math.max(1, rRenceng);
                                setBoxFormState({
                                  ...boxFormState,
                                  rasioRencengPerDus: validRenceng,
                                });
                              }}
                              suffix="Renceng"
                              className="bg-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                              Isi per Renceng (Dus):
                            </label>
                            <FormattedNumberInput
                              value={pcsPerRenceng}
                              onChange={(rPcs) => {
                                const validPcs = Math.max(1, rPcs);
                                setBoxFormState({
                                  ...boxFormState,
                                  rasioPcsPerRenceng: validPcs,
                                });
                              }}
                              suffix="Dus/Strip"
                              className="bg-white font-bold"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 pt-2 border-t border-amber-200/60">
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                              Isi per Dus (Dus):
                            </label>
                            <FormattedNumberInput
                              value={boxFormState.rasioPcsPerDus}
                              onChange={(rPcs) => {
                                const validPcs = Math.max(1, rPcs);
                                setBoxFormState({
                                  ...boxFormState,
                                  rasioPcsPerDus: validPcs,
                                });
                              }}
                              suffix="Dus"
                              className="bg-white font-bold"
                            />
                          </div>
                        </div>
                      )}

                      {/* Live Calculation Ratio Banner Removed */}
                    </div>

                    {/* STEP 2: PRECISE AUTO-CONVERSION HPP BREAKDOWN */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs">
                          <Calculator className="w-4 h-4 text-emerald-600" />
                          <span>2. Hasil Konversi Presisi Harga Beli Modal (HPP):</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Presisi Otomatis
                        </span>
                      </div>

                      <div className={`grid grid-cols-1 ${isRencengMode ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                        {/* 1. HPP Dus */}
                        <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-1">
                          <span className="text-[10px] font-bold text-amber-800 block uppercase">
                            HPP per 1 Dus (Grosir Besar)
                          </span>
                          <div className="text-base font-black text-amber-950">
                            Rp {boxCost.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-amber-700 block">
                            {totalCost > 0 && totalBoxes > 0 
                              ? `Rumus: Rp ${totalCost.toLocaleString('id-ID')} ÷ ${totalBoxes} Dus` 
                              : `Rumus: HPP Pcs × ${totalPerDus} Pcs`}
                          </span>
                        </div>

                        {/* 2. HPP Renceng (if renceng mode) */}
                        {isRencengMode && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-600 block uppercase">
                              HPP per 1 Renceng (Strip)
                            </span>
                            <div className="text-base font-black text-slate-900">
                              Rp {costPerRenceng.toLocaleString('id-ID')}
                            </div>
                            <span className="text-[9px] text-slate-500 block">
                              Rumus: HPP Dus ÷ {rencengPerDus} Renceng
                            </span>
                          </div>
                        )}

                        {/* 3. HPP Pcs */}
                        <div className="bg-emerald-50/80 p-3 rounded-xl border border-amber-200 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-800 block uppercase">
                            HPP per 1 Pcs (Eceran Satuan)
                          </span>
                          <div className="text-base font-black text-emerald-950">
                            Rp {costPerPcs.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[9px] text-emerald-700 block">
                            {totalCost > 0 && totalPcs > 0 
                              ? `Rumus: Rp ${totalCost.toLocaleString('id-ID')} ÷ ${totalPcs.toLocaleString('id-ID')} Pcs` 
                              : `Rumus: HPP Dus ÷ ${totalPerDus} Pcs`}
                          </span>
                        </div>
                      </div>

                      {/* Benchmark Margin Guidelines */}
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-950 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Rekomendasi Margin Acuan Sembako:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                          <span className="bg-white px-2 py-0.5 rounded border border-amber-200">
                            Dus (+10%): <strong>Rp {suggestedBoxPrice.toLocaleString('id-ID')}</strong>
                          </span>
                          {isRencengMode && (
                            <span className="bg-white px-2 py-0.5 rounded border border-amber-200">
                              Renceng (+15%): <strong>Rp {suggestedRencengPrice.toLocaleString('id-ID')}</strong>
                            </span>
                          )}
                          <span className="bg-white px-2 py-0.5 rounded border border-amber-200">
                            Pcs (+25%): <strong>Rp {suggestedPcsPrice.toLocaleString('id-ID')}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: DYNAMIC CUSTOM VARIANT MANAGEMENT */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div>
                          <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                            <Boxes className="w-4 h-4 text-amber-600" />
                            <span>3. Varian Harga Jual Custom (Kemasan / Eceran)</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Tentukan satuan penjualan bebas (Dus, {isRencengMode ? 'Renceng, ' : ''}Pcs, Pack, dll) dengan harga jual manual.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => addCustomVariantRow('DUS', 1, suggestedBoxPrice || 0)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Varian Custom</span>
                        </button>
                      </div>

                      {/* Quick Preset Helper Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-500">Preset Cepat:</span>
                        <button
                          type="button"
                          onClick={() => addCustomVariantRow('DUS', 1, suggestedBoxPrice || 0)}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-2xs uppercase"
                          title="Tambah varian DUS (1 Dus)"
                        >
                          Preset DUS (1 Dus)
                        </button>
                        {isRencengMode && (
                          <button
                            type="button"
                            onClick={() => addCustomVariantRow('RENCENG', 1, suggestedRencengPrice || 0)}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-2xs uppercase"
                            title="Tambah varian RENCENG (1 Renceng)"
                          >
                            Preset RENCENG (1 Renceng)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => addCustomVariantRow('PCS', 1, suggestedPcsPrice || 0)}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-2xs uppercase"
                          title="Tambah varian Eceran PCS (isi 1 Pcs)"
                        >
                          Preset PCS (1 Pcs)
                        </button>
                      </div>

                      {/* Dynamic Custom Variant Rows List */}
                      {boxFormState.packagingVariants && boxFormState.packagingVariants.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {boxFormState.packagingVariants.map((variant, vIdx) => {
                            const currentUnit = (variant.name || '').trim() || 'DUS';

                            // Quantity / Isi input by user from "Isi dus yang akan dijual"
                            const quantityNum = Number(variant.ratioToBase);
                            const quantity = !isNaN(quantityNum) && quantityNum > 0 ? quantityNum : 1;

                            // Unit cost per 1 unit of packaging
                            const { unitCost, unitSuggestedPrice } = getUnitCostAndSuggested(currentUnit);

                            // Total HPP for variant: quantity * unitCost (Harga per unit dikalikan isi unit yang akan dijual)
                            const variantHpp = quantity * unitCost;

                            const profit = (variant.sellingPrice || 0) - variantHpp;
                            const marginPct = (variant.sellingPrice || 0) > 0 ? Math.round((profit / (variant.sellingPrice || 1)) * 100) : 0;
                            const isDusUnit = currentUnit.toUpperCase().includes('DUS') || currentUnit.toUpperCase().includes('BOX') || currentUnit.toUpperCase().includes('KARTON');
                            const suggestedVariantPrice = isDusUnit && suggestedBoxPrice > 0
                              ? Math.round((quantity * suggestedBoxPrice) / 500) * 500
                              : Math.round((variantHpp * 1.15) / 50) * 50;

                            return (
                              <div
                                key={variant.id || vIdx}
                                className="bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center hover:border-amber-400 transition"
                              >
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                                    Nama Satuan / Varian:
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.name || ''}
                                    onChange={(e) => {
                                      const val = e.target.value.toUpperCase();
                                      const updated = [...(boxFormState.packagingVariants || [])];
                                      const qty = Math.max(1, Number(updated[vIdx].ratioToBase) || 1);
                                      const { unitCost: newUnitCost, unitSuggestedPrice: defaultSuggested } = getUnitCostAndSuggested(val);

                                      const calculatedCost = qty * newUnitCost;
                                      const currentPrice = updated[vIdx].sellingPrice || 0;
                                      const autoPrice = (currentPrice === 0 && defaultSuggested > 0) ? (qty * defaultSuggested) : currentPrice;

                                      updated[vIdx] = { 
                                        ...updated[vIdx], 
                                        name: val, 
                                        unitLabel: val,
                                        ratioToBase: qty,
                                        costPrice: calculatedCost,
                                        sellingPrice: autoPrice,
                                      };
                                      setBoxFormState({ ...boxFormState, packagingVariants: updated });
                                    }}
                                    placeholder="Ketik nama satuan (misal: DUS 2, KARTON, SLOP...)"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500 uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5 truncate" title={`Isi ${currentUnit} yang akan dijual`}>
                                    Isi {currentUnit} yang akan dijual
                                  </label>
                                  <FormattedNumberInput
                                    value={variant.ratioToBase}
                                    onChange={(val) => {
                                      const updated = [...(boxFormState.packagingVariants || [])];
                                      const safeQty = Math.max(1, val);
                                      const u = (updated[vIdx].name || currentUnit).toUpperCase().trim();
                                      
                                      const { unitCost: currentUnitCost, unitSuggestedPrice: currentSuggestedUnit } = getUnitCostAndSuggested(u);

                                      // Total HPP for variant: harga perdus dikalikan isi dus yang akan dijual
                                      const newTotalCost = safeQty * currentUnitCost;

                                      // Auto-scale selling price proportionally if it hasn't been specifically customized
                                      const prevQty = Math.max(1, Number(updated[vIdx].ratioToBase) || 1);
                                      const prevPrice = Number(updated[vIdx].sellingPrice) || 0;
                                      let newSellingPrice = prevPrice;

                                      if (prevPrice <= 0 && currentSuggestedUnit > 0) {
                                        newSellingPrice = safeQty * currentSuggestedUnit;
                                      } else if (prevPrice > 0 && safeQty !== prevQty) {
                                        newSellingPrice = Math.round((prevPrice / prevQty) * safeQty);
                                      }

                                      updated[vIdx] = { 
                                        ...updated[vIdx], 
                                        ratioToBase: safeQty,
                                        costPrice: newTotalCost,
                                        sellingPrice: newSellingPrice,
                                      };
                                      setBoxFormState({ ...boxFormState, packagingVariants: updated });
                                    }}
                                    suffix={currentUnit}
                                    className="bg-slate-50 font-bold uppercase"
                                  />
                                  {(variantHpp > 0 || boxCost > 0 || costPerPcs > 0) && (
                                    <div className="mt-1">
                                      {isDusUnit ? (
                                        <div className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                          <span>HPP {currentUnit}: <strong>Rp {Math.round(variantHpp).toLocaleString('id-ID')}</strong></span>
                                          <span className="text-[9px] text-amber-700 block font-normal">
                                            (Rp {Math.round(unitCost).toLocaleString('id-ID')} × {quantity} {currentUnit})
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                          <span>HPP {currentUnit}: <strong>Rp {Math.round(variantHpp).toLocaleString('id-ID')}</strong></span>
                                          <span className="text-[9px] text-slate-500 block font-normal">
                                            (Rp {Math.round(unitCost).toLocaleString('id-ID')} × {quantity} {currentUnit})
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="sm:col-span-4">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <label className="text-[10px] font-bold text-emerald-800">
                                      Harga Jual {variant.name ? variant.name : 'Varian'} (Rp):
                                    </label>
                                    {(costPerPcs > 0 || boxCost > 0 || variantHpp > 0) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...(boxFormState.packagingVariants || [])];
                                          updated[vIdx] = { ...updated[vIdx], sellingPrice: suggestedVariantPrice };
                                          setBoxFormState({ ...boxFormState, packagingVariants: updated });
                                        }}
                                        className="text-[9px] text-amber-700 hover:text-amber-900 underline font-semibold"
                                        title="Gunakan harga rekomendasi margin"
                                      >
                                        Saran: Rp {suggestedVariantPrice.toLocaleString('id-ID')}
                                      </button>
                                    )}
                                  </div>
                                  <FormattedNumberInput
                                    value={variant.sellingPrice}
                                    onChange={(val) => {
                                      const updated = [...(boxFormState.packagingVariants || [])];
                                      updated[vIdx] = { ...updated[vIdx], sellingPrice: val };
                                      setBoxFormState({ ...boxFormState, packagingVariants: updated });
                                    }}
                                    prefix="Rp"
                                    placeholder=""
                                    className="bg-white font-black text-emerald-900"
                                  />
                                  {(variant.sellingPrice || 0) > 0 && (costPerPcs > 0 || boxCost > 0 || variantHpp > 0) && (
                                    <span className={`text-[9px] font-bold mt-0.5 block truncate ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                      {profit >= 0 
                                        ? `${variant.name ? variant.name : 'Varian'} Dijual: +Rp ${Math.round(profit).toLocaleString('id-ID')} (${marginPct}%)` 
                                        : `${variant.name ? variant.name : 'Varian'} Rugi: -Rp ${Math.round(Math.abs(profit)).toLocaleString('id-ID')}`}
                                    </span>
                                  )}
                                </div>

                                <div className="sm:col-span-1 flex justify-end sm:justify-center pt-2 sm:pt-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = boxFormState.packagingVariants?.filter((_, i) => i !== vIdx);
                                      setBoxFormState({ ...boxFormState, packagingVariants: updated });
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg border border-red-200 transition"
                                    title="Hapus varian ini"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded-xl border border-dashed border-amber-300 text-center text-slate-500 text-[11px]">
                          Belum ada varian kemasan eceran. Klik salah satu tombol preset di atas atau tambah custom.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* FLOW C: PCS / RETAIL FORM (PCS & BUNGKUS) */}
              {productType === 'pcs' && (() => {
                const stockPcs = Number(pcsFormState.stock || 0);
                const totalCost = Number(pcsFormState.totalPurchaseCost || 0);
                const costPerPcs = Number(pcsFormState.costBase || 0);
                const sellingPrice = Number(pcsFormState.priceBase || 0);
                const profitPerPcs = sellingPrice - costPerPcs;
                const marginPct = sellingPrice > 0 ? Math.round((profitPerPcs / sellingPrice) * 100) : 0;
                const baseUnitLabel = (pcsFormState.baseUnit || 'pcs').toUpperCase();

                const applyMarginPcs = (pct: number) => {
                  const targetPrice = Math.round((costPerPcs * (1 + pct / 100)) / 100) * 100;
                  setPcsFormState({
                    ...pcsFormState,
                    priceBase: targetPrice,
                  });
                };

                return (
                  <div className="space-y-4">
                    {/* INPUT SECTION: SATUAN, STOK & TOTAL HARGA BELI */}
                    <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>1. Parameter Stok Masuk &amp; Total Belanja Modal:</span>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                          Barang Eceran / Retail
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                        {/* 1. Satuan Dasar */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Pilih Satuan:
                          </label>
                          <select
                            value={pcsFormState.baseUnit || 'pcs'}
                            onChange={(e) => setPcsFormState({ ...pcsFormState, baseUnit: e.target.value as UnitType })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold uppercase text-slate-900 focus:ring-2 focus:ring-blue-500 text-xs"
                          >
                            <option value="pcs">Pcs</option>
                            <option value="bungkus">Bungkus</option>
                            <option value="saset">Saset</option>
                            <option value="botol">Botol</option>
                            <option value="pouch">Pouch</option>
                            <option value="kaleng">Kaleng</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">Satuan eceran kasir.</span>
                        </div>

                        {/* 2. Total Stok Masuk */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Total Stok ({baseUnitLabel}):
                          </label>
                          <FormattedNumberInput
                            value={stockPcs}
                            onChange={(val) => {
                              const newStock = Math.max(0, val);
                              const newCost = totalCost > 0 && newStock > 0 ? Math.round(totalCost / newStock) : costPerPcs;
                              setPcsFormState({
                                ...pcsFormState,
                                stock: newStock,
                                costBase: newCost,
                              });
                            }}
                            suffix={pcsFormState.baseUnit || 'Pcs'}
                            placeholder=""
                            className="bg-white font-black text-slate-900"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">Jumlah unit masuk.</span>
                        </div>

                        {/* 3. Total Harga Beli Semua Stok */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Total Harga Beli:
                          </label>
                          <FormattedNumberInput
                            value={totalCost}
                            onChange={(val) => {
                              const newTotal = Math.max(0, val);
                              const newCost = stockPcs > 0 ? Math.round(newTotal / stockPcs) : costPerPcs;
                              setPcsFormState({
                                ...pcsFormState,
                                totalPurchaseCost: newTotal,
                                costBase: newCost,
                              });
                            }}
                            prefix="Rp"
                            placeholder=""
                            className="bg-white font-black text-slate-900"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">Total faktur belanja.</span>
                        </div>

                        {/* 4. HPP Modal per 1 Pcs (Auto-calculated) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            HPP per 1 {baseUnitLabel} (Auto):
                          </label>
                          <FormattedNumberInput
                            value={costPerPcs}
                            onChange={(val) => {
                              const newCost = Math.max(0, val);
                              const newTotal = stockPcs > 0 ? Math.round(stockPcs * newCost) : totalCost;
                              setPcsFormState({
                                ...pcsFormState,
                                costBase: newCost,
                                totalPurchaseCost: newTotal,
                              });
                            }}
                            prefix="Rp"
                            placeholder=""
                            className="bg-blue-50 border-blue-300 font-black text-blue-950"
                          />
                          <span className="text-[10px] text-blue-700 mt-1 block font-medium">
                            {stockPcs > 0 && totalCost > 0 
                              ? `Rumus: Rp ${totalCost.toLocaleString('id-ID')} ÷ ${stockPcs} ${baseUnitLabel}` 
                              : 'Otomatis dihitung'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LIVE CALCULATION & MARGIN RECOMMENDATION CARD */}
                    <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs">
                          <Calculator className="w-4 h-4 text-blue-600" />
                          <span>2. Hasil Konversi &amp; Rekomendasi Harga Jual:</span>
                        </div>
                        {costPerPcs > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-slate-500 font-semibold">Margin Acuan:</span>
                            <button
                              type="button"
                              onClick={() => applyMarginPcs(10)}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-bold border border-slate-200 transition"
                            >
                              +10%
                            </button>
                            <button
                              type="button"
                              onClick={() => applyMarginPcs(15)}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-bold border border-slate-200 transition"
                            >
                              +15%
                            </button>
                            <button
                              type="button"
                              onClick={() => applyMarginPcs(20)}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-bold border border-slate-200 transition"
                            >
                              +20%
                            </button>
                            <button
                              type="button"
                              onClick={() => applyMarginPcs(25)}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-bold border border-slate-200 transition"
                            >
                              +25%
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">
                            Harga Jual Eceran per {baseUnitLabel} (Rp):
                          </label>
                          <FormattedNumberInput
                            value={sellingPrice}
                            onChange={(val) => setPcsFormState({ ...pcsFormState, priceBase: val })}
                            prefix="Rp"
                            placeholder=""
                            className="bg-white font-black text-emerald-900"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Analisis Laba Penjualan per {baseUnitLabel}:
                          </label>
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                            profitPerPcs >= 0 
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            <span>{profitPerPcs >= 0 ? 'Potensi Keuntungan:' : 'Perhatian Rugi:'}</span>
                            <span className="font-mono">
                              {profitPerPcs >= 0 
                                ? `+Rp ${profitPerPcs.toLocaleString('id-ID')} (${marginPct}%)` 
                                : `-Rp ${Math.abs(profitPerPcs).toLocaleString('id-ID')}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Projection Banner */}
                      {stockPcs > 0 && sellingPrice > 0 && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            Estimasi Total Omzet: <strong className="text-slate-900">Rp {(stockPcs * sellingPrice).toLocaleString('id-ID')}</strong>
                          </div>
                          <div>
                            Estimasi Total Laba: <strong className={profitPerPcs >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                              {profitPerPcs >= 0 ? '+' : ''}Rp {(stockPcs * profitPerPcs).toLocaleString('id-ID')}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* FLOW D: LITER / LIQUID FORM (BARANG CAIR) */}
              {productType === 'liter' && (() => {
                const stockLiter = Number(literFormState.stock || 0);
                const totalCost = Number(literFormState.totalPurchaseCost || 0);
                const costPerLiter = Number(literFormState.costBase || 0);
                const cost500ml = Math.round(costPerLiter * 0.5);
                const cost250ml = Math.round(costPerLiter * 0.25);
                const cost100ml = Math.round(costPerLiter * 0.1);
                const cost1ml = costPerLiter > 0 ? (costPerLiter / 1000) : 0;
                const sellingPrice = Number(literFormState.priceBase || 0);
                const profitPerLiter = sellingPrice - costPerLiter;
                const marginPct = sellingPrice > 0 ? Math.round((profitPerLiter / sellingPrice) * 100) : 0;

                const applyMarginLiter = (pct: number) => {
                  const targetPrice = Math.round((costPerLiter * (1 + pct / 100)) / 100) * 100;
                  setLiterFormState({
                    ...literFormState,
                    priceBase: targetPrice,
                  });
                };

                const addLiterVariantPreset = (ratio: number, defaultName: string) => {
                  const existing = literFormState.packagingVariants || [];
                  let suggestedPrice = Math.round((sellingPrice * ratio) / 100) * 100;
                  if (suggestedPrice < 500) suggestedPrice = 1000;

                  const newVariant: RetailPackagingVariant = {
                    id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    name: defaultName,
                    ratioToBase: ratio,
                    unitLabel: 'Botol',
                    sellingPrice: suggestedPrice,
                    costPrice: Math.round(costPerLiter * ratio),
                  };
                  setLiterFormState({
                    ...literFormState,
                    packagingVariants: [...existing, newVariant],
                  });
                };

                return (
                  <div className="space-y-4">
                    {/* INPUT SECTION: STOK LITER & TOTAL HARGA BELI */}
                    <div className="bg-cyan-50/70 border border-cyan-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-cyan-950 flex items-center gap-1.5 text-xs">
                          <Droplets className="w-4 h-4 text-cyan-600" />
                          <span>1. Input Stok Masuk &amp; Total Belanja Modal (Barang Cair):</span>
                        </div>
                        <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md">
                          Base Unit: LITER (Desimal Otomatis)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                        {/* 1. Satuan Dasar */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Satuan Utama:
                          </label>
                          <select
                            value={literFormState.baseUnit || 'liter'}
                            onChange={(e) => setLiterFormState({ ...literFormState, baseUnit: e.target.value as UnitType })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold uppercase text-slate-900 focus:ring-2 focus:ring-cyan-500 text-xs"
                          >
                            <option value="liter">Liter</option>
                            <option value="botol">Botol</option>
                            <option value="pouch">Pouch</option>
                            <option value="jerigen">Jerigen</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">Satuan master cairan.</span>
                        </div>

                        {/* 2. Total Stok Masuk (Liter) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Total Stok (Liter):
                          </label>
                          <FormattedNumberInput
                            value={stockLiter}
                            onChange={(val) => {
                              const newStock = Math.max(0, val);
                              const newCost = totalCost > 0 && newStock > 0 ? Math.round(totalCost / newStock) : costPerLiter;
                              setLiterFormState({
                                ...literFormState,
                                stock: newStock,
                                costBase: newCost,
                              });
                            }}
                            allowDecimal={true}
                            suffix="Liter"
                            placeholder=""
                            className="bg-white font-black text-slate-900"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">Contoh: 20 Liter atau 20.5 L.</span>
                        </div>

                        {/* 3. Total Harga Beli Semua Stok */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Total Harga Beli:
                          </label>
                          <FormattedNumberInput
                            value={totalCost}
                            onChange={(val) => {
                              const newTotal = Math.max(0, val);
                              const newCost = stockLiter > 0 ? Math.round(newTotal / stockLiter) : costPerLiter;
                              setLiterFormState({
                                ...literFormState,
                                totalPurchaseCost: newTotal,
                                costBase: newCost,
                              });
                            }}
                            prefix="Rp"
                            placeholder=""
                            className="bg-white font-black text-slate-900"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">Total nilai faktur kulakan.</span>
                        </div>

                        {/* 4. HPP Modal per 1 Liter (Auto-calculated) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            HPP per 1 Liter (Auto):
                          </label>
                          <FormattedNumberInput
                            value={costPerLiter}
                            onChange={(val) => {
                              const newCost = Math.max(0, val);
                              const newTotal = stockLiter > 0 ? Math.round(stockLiter * newCost) : totalCost;
                              setLiterFormState({
                                ...literFormState,
                                costBase: newCost,
                                totalPurchaseCost: newTotal,
                              });
                            }}
                            prefix="Rp"
                            placeholder=""
                            className="bg-cyan-50 border-cyan-300 font-black text-cyan-950"
                          />
                          <span className="text-[10px] text-cyan-700 mt-1 block font-semibold">
                            {stockLiter > 0 && totalCost > 0 
                              ? `Rumus: Rp ${totalCost.toLocaleString('id-ID')} ÷ ${stockLiter.toLocaleString('id-ID')} Liter = Rp ${costPerLiter.toLocaleString('id-ID')} / Liter` 
                              : 'Rumus: Total Harga Beli ÷ Total Stok (Liter)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LIVE AUTOMATIC CONVERSION DOWNWARD BREAKDOWN */}
                    <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-cyan-100 pb-2">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs">
                          <Calculator className="w-4 h-4 text-cyan-600" />
                          <span>2. Konversi Otomatis Rincian Modal ke Bawah (Per Liter &amp; Mililiter):</span>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                          Presisi Real-time
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {/* HPP 1 Liter */}
                        <div className="bg-cyan-500 text-white p-2.5 rounded-xl border border-cyan-600 text-center shadow-xs col-span-2 sm:col-span-1">
                          <span className="text-[10px] font-black uppercase text-cyan-100 block">HPP 1 Liter</span>
                          <span className="text-xs sm:text-sm font-black text-white mt-0.5 block">
                            Rp {costPerLiter.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] text-cyan-100 block mt-0.5">Rumus: Beli &divide; Stok</span>
                        </div>

                        {/* 500 ml */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] font-bold text-slate-600 block uppercase">Per 500 ml (1/2 L)</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block">
                            Rp {cost500ml.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Rumus: HPP &times; 0.5</span>
                        </div>

                        {/* 250 ml */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] font-bold text-slate-600 block uppercase">Per 250 ml (1/4 L)</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block">
                            Rp {cost250ml.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Rumus: HPP &times; 0.25</span>
                        </div>

                        {/* 100 ml */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] font-bold text-slate-600 block uppercase">Per 100 ml</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block">
                            Rp {cost100ml.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Rumus: HPP &times; 0.1</span>
                        </div>

                        {/* 1 ml */}
                        <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-center col-span-2 sm:col-span-1">
                          <span className="text-[10px] font-bold text-amber-800 block uppercase">Per 1 ml</span>
                          <span className="text-xs sm:text-sm font-black text-amber-950 mt-0.5 block">
                            Rp {cost1ml > 0 ? cost1ml.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '0'}
                          </span>
                          <span className="text-[9px] text-amber-600 block mt-0.5">Rumus: HPP &divide; 1.000</span>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC PACKAGING VARIANTS FOR LITER */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                            <Package className="w-4 h-4 text-cyan-600" />
                            <span>3. Varian Kemasan Eceran Botol / Pouch / Jerigen (Potong Stok Master Liter)</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Kemasan repacking minyak goreng/cairan. Stok master liter terpotong otomatis saat transaksi.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newVariant: RetailPackagingVariant = {
                              id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                              name: 'Kemasan Botol 500ml',
                              ratioToBase: 0.5,
                              unitLabel: 'Botol',
                              sellingPrice: Math.round((costPerLiter * 0.5 * 1.15) / 100) * 100 || 8000,
                              costPrice: Math.round(costPerLiter * 0.5),
                            };
                            setLiterFormState({
                              ...literFormState,
                              packagingVariants: [...(literFormState.packagingVariants || []), newVariant],
                            });
                          }}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Varian Kemasan</span>
                        </button>
                      </div>

                      {/* Quick Presets for Liquids */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">Preset Cepat:</span>
                        <button
                          type="button"
                          onClick={() => addLiterVariantPreset(0.25, 'Kemasan Cup 250ml')}
                          className="px-2.5 py-1 bg-white hover:bg-cyan-100 text-cyan-900 border border-cyan-300 rounded-lg text-[10px] font-bold transition shadow-2xs"
                        >
                          Cup 250ml (0.25 L)
                        </button>
                        <button
                          type="button"
                          onClick={() => addLiterVariantPreset(0.5, 'Kemasan Botol 500ml')}
                          className="px-2.5 py-1 bg-white hover:bg-cyan-100 text-cyan-900 border border-cyan-300 rounded-lg text-[10px] font-bold transition shadow-2xs"
                        >
                          Botol 500ml (0.5 L)
                        </button>
                      </div>

                      {/* Variant list table */}
                      {literFormState.packagingVariants && literFormState.packagingVariants.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {literFormState.packagingVariants.map((variant, vIdx) => {
                            const variantHpp = costPerLiter * (variant.ratioToBase || 0);
                            const profit = variant.sellingPrice - variantHpp;
                            const margin = variant.sellingPrice > 0 ? Math.round((profit / variant.sellingPrice) * 100) : 0;
                            const maxPacks = stockLiter > 0 && variant.ratioToBase > 0 ? Math.floor(stockLiter / variant.ratioToBase) : 0;

                            return (
                              <div
                                key={variant.id || vIdx}
                                className="bg-white p-3 rounded-xl border border-cyan-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center hover:border-cyan-400 transition"
                              >
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nama Kemasan:</label>
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => {
                                      const updated = [...(literFormState.packagingVariants || [])];
                                      updated[vIdx] = { ...updated[vIdx], name: e.target.value };
                                      setLiterFormState({ ...literFormState, packagingVariants: updated });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Isi (Liter):</label>
                                  <FormattedNumberInput
                                    value={variant.ratioToBase}
                                    onChange={(val) => {
                                      const updated = [...(literFormState.packagingVariants || [])];
                                      const ratio = Math.max(0.01, val);
                                      updated[vIdx] = { 
                                        ...updated[vIdx], 
                                        ratioToBase: ratio,
                                        costPrice: Math.round(costPerLiter * ratio)
                                      };
                                      setLiterFormState({ ...literFormState, packagingVariants: updated });
                                    }}
                                    allowDecimal={true}
                                    suffix="L"
                                    className="bg-slate-50 font-bold"
                                  />
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    HPP: Rp {Math.round(variantHpp).toLocaleString('id-ID')} &bull; Stok: {maxPacks} botol
                                  </span>
                                </div>

                                <div className="sm:col-span-4">
                                  <label className="text-[10px] font-bold text-emerald-800 block mb-0.5">Harga Jual (Rp):</label>
                                  <FormattedNumberInput
                                    value={variant.sellingPrice}
                                    onChange={(val) => {
                                      const updated = [...(literFormState.packagingVariants || [])];
                                      updated[vIdx] = { ...updated[vIdx], sellingPrice: val };
                                      setLiterFormState({ ...literFormState, packagingVariants: updated });
                                    }}
                                    prefix="Rp"
                                    className="bg-white font-black text-emerald-900"
                                  />
                                  {variant.sellingPrice > 0 && costPerLiter > 0 && (
                                    <span className={`text-[9px] font-bold block mt-0.5 ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                      {profit >= 0 ? `+Rp ${Math.round(profit).toLocaleString('id-ID')} (${margin}%)` : `-Rp ${Math.round(Math.abs(profit)).toLocaleString('id-ID')}`}
                                    </span>
                                  )}
                                </div>

                                <div className="sm:col-span-1 flex justify-end sm:justify-center pt-2 sm:pt-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = literFormState.packagingVariants?.filter((_, i) => i !== vIdx);
                                      setLiterFormState({ ...literFormState, packagingVariants: updated });
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                                    title="Hapus varian"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded-xl border border-dashed border-cyan-300 text-center text-slate-500 text-[11px]">
                          Belum ada varian kemasan botol/pouch. Klik salah satu tombol preset di atas atau tambah custom.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* GENERAL ALERT THRESHOLD */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Batas Peringatan Stok Menipis (Warning Alert):
                </label>
                <FormattedNumberInput
                  value={formCommon.minStockAlert}
                  onChange={(val) => setFormCommon({ ...formCommon, minStockAlert: val })}
                  allowDecimal={productType === 'kg' || productType === 'liter'}
                  suffix={productType === 'kg' ? 'kg' : productType === 'liter' ? 'liter' : 'pcs'}
                  placeholder=""
                  className="bg-slate-50"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sistem memberikan peringatan visual di kasir jika stok &le; {formCommon.minStockAlert || 0}
                </p>
              </div>

              </div>
            )}
          </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
              >
                Batal
              </button>
              {productType ? (
                <button
                  type="button"
                  onClick={handleSaveProductForm}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Data Produk</span>
                </button>
              ) : (
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Pilih Tipe Produk di Atas
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Produk dari Database?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><strong>Nama Barang:</strong> {deletingProductTarget.name}</div>
              <div><strong>Kode SKU:</strong> <span className="font-mono font-bold text-slate-800">{deletingProductTarget.code}</span></div>
              <div><strong>Sisa Stok:</strong> {deletingProductTarget.stock} {deletingProductTarget.baseUnit}</div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus produk <strong>"{deletingProductTarget.name}"</strong> secara permanen dari katalog stok toko?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProductTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(deletingProductTarget.id);
                  const name = deletingProductTarget.name;
                  setDeletingProductTarget(null);
                  showToast(`Produk "${name}" berhasil dihapus secara real-time!`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Produk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
