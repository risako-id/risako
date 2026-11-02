"use client";

import { useActionState } from "react";
import { gantiPassword } from "@/app/profil/actions";

export default function FormGantiPassword() {
  const [state, formAction, isPending] = useActionState(gantiPassword, null);

  return (
    <form action={formAction} className="card" style={{ maxWidth: '400px' }}>
      <h3 style={{ marginTop: 0 }}>Ganti Password</h3>
      
      {state?.error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>
          {state.message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input name="password" type="password" placeholder="Password Baru (min. 6 karakter)" required />
        <input name="confirm" type="password" placeholder="Ulangi Password Baru" required />
        <button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Password"}
        </button>
      </div>
    </form>
  );
}
