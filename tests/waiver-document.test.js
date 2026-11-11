import { test } from "node:test";
import assert from "node:assert/strict";
import { displayPhone, docDate, docTime, waiverFileName } from "../src/lib/waiver-document.js";

test("nama file PDF: nomor surat, nama, dan negara", () => {
  assert.equal(waiverFileName({ code: "DW-261111-HJG72", name: "DAMPIER's Team", nationality: "Indonesia" }), "DW-261111-HJG72_DAMPIERs_Team_Indonesia");
  assert.equal(
    waiverFileName({ code: "DW-260727-ABCDE", name: "Engelina Teuntje van den broek", nationality: "Dutch" }),
    "DW-260727-ABCDE_Engelina_Teuntje_van_den_broek_Dutch",
  );
  // Huruf beraksen dan aksara lain tetap, tanda yang dilarang di nama file dibuang.
  assert.equal(waiverFileName({ code: "DW-261111-AAAAA", name: "Jérôme D/Ávila: \"JJ\"", nationality: "Côte d'Ivoire" }), "DW-261111-AAAAA_Jérôme_D_Ávila_JJ_Côte_dIvoire");
  assert.equal(waiverFileName({ code: "DW-261111-BBBBB", name: "李伟", nationality: "中国" }), "DW-261111-BBBBB_李伟_中国");
  assert.equal(waiverFileName({ code: "DW-261111-CCCCC", name: "  ", nationality: "" }), "DW-261111-CCCCC");
  assert.ok(waiverFileName({ code: "DW-261111-DDDDD", name: "x".repeat(300), nationality: "Y" }).length <= 120);
});

test("tanggal dan jam dokumen dalam WIT", () => {
  assert.equal(docDate("2026-11-11"), "11 Nov 2026");
  assert.equal(docDate("2026-11-11T15:30:00.000Z"), "12 Nov 2026", "15.30 UTC sudah tanggal 12 di WIT");
  assert.equal(docTime("2026-11-11T10:34:00.000Z"), "19:34");
  assert.equal(docDate(""), "");
  assert.equal(docDate("bukan tanggal"), "");
});

test("nomor WhatsApp di kop mudah dibaca", () => {
  assert.equal(displayPhone("6281234567890"), "+62 812 3456 7890");
  assert.equal(displayPhone("6282291311277"), "+62 822 9131 1277");
  assert.equal(displayPhone("33612345678"), "+33612345678");
  assert.equal(displayPhone(null), "");
});
