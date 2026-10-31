"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <form action={formAction} className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Risako ERP</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px', fontSize: '0.9rem' }}>Masuk ke sistem manajemen toko</p>
        
        {state?.error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>
            {state.error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="username" type="text" placeholder="Username (contoh: owner / budi)" required style={{ width: '100%' }} />
          <input name="password" type="password" placeholder="Password" required style={{ width: '100%' }} />
          <button type="submit" disabled={isPending} style={{ width: '100%', marginTop: '10px' }}>
            {isPending ? "Memproses..." : "Masuk"}
          </button>
        </div>
      </form>
    </div>
  );
}
