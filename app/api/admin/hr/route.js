import { attendanceRecap, computePayslip, validateAttendance } from "@/lib/modules/hr";
import { isMonth, monthRange, RecordError } from "@/lib/records";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { deleteOnDate, deleteRecord, getRecord, insertRaw, listRecords } from "@/server/records";

export const dynamic = "force-dynamic";

// HRD: simpan absensi satu hari ({ action: "attendance", date, rows }) dan kunci/buka slip gaji
// ({ action: "lock" | "unlock", month, employeeId }). Slip yang dikunci menyimpan angka saat itu.
export async function POST(request) {
  const { admin, error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request, 60_000);
  try {
    if (input?.action === "attendance") {
      const employees = await listRecords("employee");
      const { date, rows } = validateAttendance(input, employees.map((e) => e.id));
      await deleteOnDate("attendance", date);
      for (const row of rows) await insertRaw("attendance", "abs", date, row, admin.email);
      return Response.json({ ok: true, saved: rows.length });
    }
    if (input?.action === "lock" || input?.action === "unlock") {
      if (!isMonth(input.month)) throw new RecordError("Bulan tidak valid.");
      const employee = await getRecord("employee", String(input.employeeId));
      if (!employee) throw new RecordError("Pegawai tidak ditemukan.");
      const slips = (await listRecords("payslip", { from: `${input.month}-01`, to: `${input.month}-01` })).filter((s) => s.employeeId === employee.id);
      for (const slip of slips) await deleteRecord("payslip", slip.id);
      if (input.action === "lock") {
        const { from, to } = monthRange(input.month);
        const attendance = (await listRecords("attendance", { from, to })).filter((a) => a.employeeId === employee.id);
        const slip = computePayslip(employee, attendanceRecap(attendance)[employee.id]);
        await insertRaw("payslip", "slp", `${input.month}-01`, { ...slip, month: input.month, lockedAt: new Date().toISOString(), lockedBy: admin.email }, admin.email);
      }
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  } catch (e) {
    if (e instanceof RecordError) return Response.json({ error: e.message }, { status: 400 });
    console.error(`[admin/hr] ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
