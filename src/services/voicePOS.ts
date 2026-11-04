import { Product } from '../types';
import { storage } from './storage';
import { sound } from './audio';

export interface VoicePOSResult {
  action: 'ADD_TO_CART' | 'CLEAR_CART' | 'CHECKOUT_ATTEMPT' | 'NOT_FOUND' | 'ERROR';
  product?: Product;
  unit?: string;
  quantity?: number;
  variantId?: string;
  rawText: string;
  matchedText?: string;
  message: string;
}

// Map Indonesian spoken number words to digits
const NUMBER_WORDS: Record<string, number> = {
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  'dua belas': 12,
  'tiga belas': 13,
  'empat belas': 14,
  'lima belas': 15,
  'dua puluh': 20,
  'tiga puluh': 30,
  'lima puluh': 50,
  seratus: 100,
};

// Unit aliases for Indonesian voice input
const UNIT_ALIASES: Record<string, string[]> = {
  kg: ['kg', 'kilo', 'kilogram', 'kilos'],
  gram: ['gram', 'g', 'ons'],
  dus: ['dus', 'box', 'karton', 'dos'],
  renceng: ['renceng', 'renteng', 'rcg', 'pack'],
  pcs: ['pcs', 'biji', 'buah', 'sachet', 'bungkus', 'biji', 'satuan'],
  liter: ['liter', 'lit', 'l', 'botol', 'jerigen'],
};

/**
 * Clean & normalize spoken Indonesian transcript
 */
export function normalizeTranscript(text: string): string {
  let cleaned = text.trim().toLowerCase();
  // Remove punctuation
  cleaned = cleaned.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Extract quantity and fraction from Indonesian speech phrases
 */
export function extractQuantityAndCleanText(text: string): { quantity: number; unitHint?: string; cleanedText: string } {
  let cleaned = text;
  let quantity = 1;
  let unitHint: string | undefined;

  // Stripping action prefixes
  const prefixRegex = /^(tolong\s+)?(masukkan|tambah|tambahkan|beli|pesan|kasih|minta|input|ambil)\s+/i;
  cleaned = cleaned.replace(prefixRegex, '').trim();

  // 1. Gram conversions (e.g. 500 gram -> 0.5 kg, 250 gram -> 0.25 kg)
  const gramMatch = cleaned.match(/(\d+|\b(lima|dua|satu)\s*ratus\b)\s*(gram|g)\b/i);
  if (gramMatch) {
    const rawGramNum = gramMatch[1].toLowerCase();
    let numGram = parseInt(rawGramNum, 10);
    if (isNaN(numGram)) {
      if (rawGramNum.includes('lima')) numGram = 500;
      else if (rawGramNum.includes('dua')) numGram = 250;
      else if (rawGramNum.includes('satu')) numGram = 100;
    }
    if (numGram > 0) {
      quantity = numGram / 1000;
      unitHint = 'kg';
      cleaned = cleaned.replace(gramMatch[0], '').trim();
      return { quantity, unitHint, cleanedText: cleaned };
    }
  }

  // 2. Milliliter conversions (e.g. 500 ml -> 0.5 liter)
  const mlMatch = cleaned.match(/(\d+)\s*(ml|mili|milliliter)\b/i);
  if (mlMatch) {
    const mlVal = parseInt(mlMatch[1], 10);
    if (mlVal > 0) {
      quantity = mlVal / 1000;
      unitHint = 'liter';
      cleaned = cleaned.replace(mlMatch[0], '').trim();
      return { quantity, unitHint, cleanedText: cleaned };
    }
  }

  // 3. Fraction phrases
  // "setengah dua" or "dua setengah" -> 2.5
  if (/\b(dua\s+setengah|setengah\s+dua|2\s+setengah|setengah\s+2)\b/i.test(cleaned)) {
    quantity = 2.5;
    cleaned = cleaned.replace(/\b(dua\s+setengah|setengah\s+dua|2\s+setengah|setengah\s+2)\b/i, '').trim();
  } else if (/\b(satu\s+setengah|1\s+setengah|setengah\s+satu|setengah\s+1)\b/i.test(cleaned)) {
    quantity = 1.5;
    cleaned = cleaned.replace(/\b(satu\s+setengah|1\s+setengah|setengah\s+satu|setengah\s+1)\b/i, '').trim();
  } else if (/\b(tiga\s+setengah|3\s+setengah)\b/i.test(cleaned)) {
    quantity = 3.5;
    cleaned = cleaned.replace(/\b(tiga\s+setengah|3\s+setengah)\b/i, '').trim();
  } else if (/\b(seperempat|seper\s*4|1\/4|0[,.]25)\b/i.test(cleaned)) {
    quantity = 0.25;
    cleaned = cleaned.replace(/\b(seperempat|seper\s*4|1\/4|0[,.]25)\b/i, '').trim();
  } else if (/\b(tiga\s+perempat|3\/4|0[,.]75)\b/i.test(cleaned)) {
    quantity = 0.75;
    cleaned = cleaned.replace(/\b(tiga\s+perempat|3\/4|0[,.]75)\b/i, '').trim();
  } else if (/\b(setengah|1\/2|0[,.]5)\b/i.test(cleaned)) {
    quantity = 0.5;
    cleaned = cleaned.replace(/\b(setengah|1\/2|0[,.]5)\b/i, '').trim();
  } else {
    // 4. Standalone digits (e.g. "beras 5 kilo" or "5 beras")
    const digitMatch = cleaned.match(/\b(\d+([,.]\d+)?)\b/);
    if (digitMatch) {
      const parsedNum = parseFloat(digitMatch[1].replace(',', '.'));
      if (!isNaN(parsedNum) && parsedNum > 0) {
        quantity = parsedNum;
        cleaned = cleaned.replace(digitMatch[0], '').trim();
      }
    } else {
      // 5. Word numbers (e.g. "dua botol", "tiga kg")
      for (const [w, val] of Object.entries(NUMBER_WORDS)) {
        const wordRegex = new RegExp(`\\b${w}\\b`, 'i');
        if (wordRegex.test(cleaned)) {
          quantity = val;
          cleaned = cleaned.replace(wordRegex, '').trim();
          break;
        }
      }
    }
  }

  // Detect unit keyword from cleaned text if present
  for (const [canonicalUnit, aliases] of Object.entries(UNIT_ALIASES)) {
    for (const alias of aliases) {
      const aliasRegex = new RegExp(`\\b${alias}\\b`, 'i');
      if (aliasRegex.test(cleaned)) {
        unitHint = canonicalUnit;
        cleaned = cleaned.replace(aliasRegex, '').trim();
        break;
      }
    }
    if (unitHint) break;
  }

  return { quantity, unitHint, cleanedText: cleaned.trim() };
}

/**
 * Intelligent Indonesian Voice Parser for POS
 */
export function parseVoiceCommand(
  rawTranscript: string, 
  products: Product[]
): VoicePOSResult {
  const norm = normalizeTranscript(rawTranscript);

  if (!norm) {
    return {
      action: 'ERROR',
      rawText: rawTranscript,
      message: 'Suara tidak terdeteksi jelas.',
    };
  }

  // 1. Check for Command Intents
  if (/\b(batal|kosongkan|reset|hapus\s+semua)\s*(keranjang|pesanan)?\b/i.test(norm)) {
    return {
      action: 'CLEAR_CART',
      rawText: rawTranscript,
      message: 'Keranjang belanja dikosongkan.',
    };
  }

  if (/\b(checkout|bayar|selesai|proses\s+bayar|lanjut\s+pembayaran)\b/i.test(norm)) {
    return {
      action: 'CHECKOUT_ATTEMPT',
      rawText: rawTranscript,
      message: 'Demi keamanan transaksi, tombol Checkout & Pembayaran harus dilakukan secara manual oleh kasir.',
    };
  }

  // 2. Extract Quantity, Unit Hint, and Product Name
  const { quantity, unitHint, cleanedText } = extractQuantityAndCleanText(norm);
  const targetNameQuery = cleanedText.trim().toLowerCase();

  if (!targetNameQuery) {
    return {
      action: 'NOT_FOUND',
      rawText: rawTranscript,
      message: `Jumlah (${quantity}) terdeteksi, tetapi nama produk belum disebutkan.`,
    };
  }

  // 3. Product Matching Algorithm
  let bestMatch: Product | null = null;
  let highestScore = 0;

  for (const prod of products) {
    const pName = prod.name.toLowerCase();
    const pCode = prod.code.toLowerCase();
    const pCat = prod.category.toLowerCase();

    // Exact SKU or Code Match
    if (pCode === targetNameQuery) {
      bestMatch = prod;
      highestScore = 100;
      break;
    }

    // Exact Name Match
    if (pName === targetNameQuery) {
      bestMatch = prod;
      highestScore = 95;
      break;
    }

    // Substring Match
    if (pName.includes(targetNameQuery) || targetNameQuery.includes(pName)) {
      const score = 80 + (targetNameQuery.length / Math.max(pName.length, 1)) * 10;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = prod;
      }
      continue;
    }

    // Tokenized Word Overlap Match
    const queryTokens = targetNameQuery.split(/\s+/).filter((t) => t.length > 1);
    const prodTokens = pName.split(/\s+/).concat(pCat.split(/\s+/));

    let matchCount = 0;
    for (const qToken of queryTokens) {
      if (prodTokens.some((pToken) => pToken.includes(qToken) || qToken.includes(pToken))) {
        matchCount++;
      }
    }

    if (queryTokens.length > 0) {
      const tokenScore = (matchCount / queryTokens.length) * 70;
      if (tokenScore > 40 && tokenScore > highestScore) {
        highestScore = tokenScore;
        bestMatch = prod;
      }
    }
  }

  if (!bestMatch || highestScore < 35) {
    return {
      action: 'NOT_FOUND',
      rawText: rawTranscript,
      matchedText: targetNameQuery,
      message: `Produk "${targetNameQuery}" tidak ditemukan di katalog stok. Coba sebutkan kata kunci lain.`,
    };
  }

  // 4. Determine Unit & Variant
  const availableUnits = storage.getAvailableUnitsForProduct(bestMatch);
  let selectedUnit: string = bestMatch.baseUnit;
  let selectedVariantId: string | undefined;

  if (unitHint && availableUnits.length > 0) {
    const hintMatch = availableUnits.find((u) => {
      const uName = u.unit.toLowerCase();
      const aliases = UNIT_ALIASES[unitHint] || [unitHint];
      return aliases.some((a) => uName.includes(a));
    });

    if (hintMatch) {
      selectedUnit = hintMatch.unit;
      selectedVariantId = hintMatch.variantId;
    }
  }

  // Fallback to first variant if product relies on packaging variants
  if (!selectedVariantId && availableUnits.length > 0) {
    selectedUnit = availableUnits[0].unit;
    selectedVariantId = availableUnits[0].variantId;
  }

  return {
    action: 'ADD_TO_CART',
    product: bestMatch,
    unit: selectedUnit,
    quantity,
    variantId: selectedVariantId,
    rawText: rawTranscript,
    matchedText: bestMatch.name,
    message: `Berhasil menambahkan ${bestMatch.name} (${quantity} ${selectedUnit}) ke keranjang!`,
  };
}

/**
 * Continuous Web Speech Recognition Controller (Hands-Free POS Input)
 */
export class ContinuousVoicePOSController {
  private recognition: any = null;
  private isListening: boolean = false;
  private isContinuous: boolean = true;
  private onResultCallback?: (result: VoicePOSResult) => void;
  private onStatusChangeCallback?: (isListening: boolean, interimText: string) => void;
  private lastProcessedTranscript: string = '';
  private restartTimeout: any = null;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[Voice POS] Web Speech API not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'id-ID';
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }

      if (interim && this.onStatusChangeCallback) {
        this.onStatusChangeCallback(true, interim);
      }

      if (final && final.trim()) {
        const cleanFinal = final.trim();
        if (cleanFinal !== this.lastProcessedTranscript) {
          this.lastProcessedTranscript = cleanFinal;
          this.handleFinalTranscript(cleanFinal);
        }
      }
    };

    rec.onerror = (event: any) => {
      console.warn('[Voice POS] Speech Error:', event.error);
      if (event.error === 'no-speech') return;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(this.isListening, '');
      }
    };

    rec.onend = () => {
      // Auto-restart if continuous mode is still desired
      if (this.isListening && this.isContinuous) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = setTimeout(() => {
          if (this.isListening) {
            try {
              rec.start();
            } catch {
              // Ignore restart collision
            }
          }
        }, 300);
      } else {
        this.isListening = false;
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback(false, '');
        }
      }
    };

    this.recognition = rec;
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(
    products: Product[],
    onResult: (result: VoicePOSResult) => void,
    onStatusChange?: (isListening: boolean, interimText: string) => void
  ) {
    if (!this.recognition) {
      alert('Browser Anda belum mendukung input suara Web Speech API (Gunakan Google Chrome / MS Edge).');
      return;
    }

    this.onResultCallback = onResult;
    this.onStatusChangeCallback = onStatusChange;
    this.isListening = true;
    this.isContinuous = true;
    this.lastProcessedTranscript = '';

    try {
      this.recognition.start();
      sound.playVoiceChime();
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(true, '');
      }
    } catch (e) {
      console.warn('[Voice POS] Start error:', e);
    }
  }

  public stop() {
    this.isListening = false;
    this.isContinuous = false;
    clearTimeout(this.restartTimeout);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(false, '');
    }
  }

  private handleFinalTranscript(transcript: string) {
    if (!this.onResultCallback) return;
    const products = storage.getProducts();
    const parsed = parseVoiceCommand(transcript, products);
    this.onResultCallback(parsed);
  }
}

export const voicePOSController = new ContinuousVoicePOSController();
