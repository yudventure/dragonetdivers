"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { convert, defaultCurrency, formatMoney, formatRateDate, isCurrency } from "@/lib/currency";
import { format } from "@/lib/i18n";

const STORAGE_KEY = "dd_currency";

const CurrencyContext = createContext({ currency: "IDR", preferred: "IDR", rate: null, lang: "en", setCurrency: () => {} });

// Pilihan mata uang tamu (USD atau IDR) untuk seluruh situs, diingat di perangkatnya (localStorage)
// dan ikut berubah di tab lain. Sebelum tamu memilih: halaman English → USD, Indonesia → IDR.
// Tanpa kurs (rate null), harga tetap tampil dalam Rupiah.
export function CurrencyProvider({ lang, rate, children }) {
  const [chosen, setChosen] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isCurrency(saved)) setChosen(saved);
    } catch {}
    const onStorage = (event) => event.key === STORAGE_KEY && isCurrency(event.newValue) && setChosen(event.newValue);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setCurrency = useCallback((value) => {
    if (!isCurrency(value)) return;
    setChosen(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
  }, []);

  const preferred = chosen ?? defaultCurrency(lang);
  const currency = preferred === "USD" && !rate ? "IDR" : preferred;
  const value = useMemo(() => ({ currency, preferred, rate, lang, setCurrency }), [currency, preferred, rate, lang, setCurrency]);
  return <CurrencyContext value={value}>{children}</CurrencyContext>;
}

export const useCurrency = () => useContext(CurrencyContext);

/**
 * Harga yang ditulis dalam Rupiah, tampil sesuai mata uang pilihan tamu: <Price idr={1500000} />.
 * Mode USD menampilkan perkiraan "≈ US$92", dengan nilai Rupiah aslinya di tooltip.
 */
export function Price({ idr, className }) {
  const { currency, rate, lang } = useCurrency();
  const rupiah = formatMoney(idr, "IDR", lang);
  const amount = convert(idr, currency, rate);
  if (currency === "IDR" || amount == null) return <span className={className}>{rupiah}</span>;
  return (
    <span className={className} title={rupiah}>
      ≈ {formatMoney(amount, "USD", lang)}
    </span>
  );
}

/** Baris kurs untuk menu: "US$1 ≈ Rp 16.312" dan sumbernya, atau null tanpa kurs. */
export function useRateText(text) {
  const { rate, lang } = useCurrency();
  if (!rate) return null;
  const date = formatRateDate(rate.date, lang);
  return {
    rate: format(text.rate, { idr: formatMoney(rate.idrPerUsd, "IDR", lang) }),
    source: rate.source === "ecb" && date ? format(text.rateEcb, { date }) : text.rateManual,
  };
}
