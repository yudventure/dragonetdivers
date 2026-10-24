// Rekening transfer dari pemilik (Oktober 2026, "Payment Details · Bank Transfer"). Dimasukkan sekali ke
// pengaturan /admin/pembayaran beserta menyalakan transfer bank (ensureBankAccount di
// src/server/payment-settings.js, penanda settings baris bank_account_<version>), jadi rekening yang
// kemudian diubah atau dihapus tim tidak kembali. SWIFT/BIC untuk tamu yang mentransfer dari luar negeri.
export const OWNER_BANK = {
  version: "2026-10",
  account: {
    bank: "Bank Rakyat Indonesia (BRI)",
    number: "031001001442567",
    holder: "PT Nusa Birawa Integrated",
    swift: "BRINIDJAXXX",
  },
};
