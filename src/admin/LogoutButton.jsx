"use client";

import { LogOutIcon } from "../components/icons";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/admin");
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate transition-colors duration-200 ease-brand hover:bg-teal-wash hover:text-teal"
    >
      <LogOutIcon className="size-[18px]" />
      Keluar
    </button>
  );
}
