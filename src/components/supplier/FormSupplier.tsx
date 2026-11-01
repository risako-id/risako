"use client";

export default function FormSupplier({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card">
      <h2 style={{ marginTop: 0 }}>Tambah Supplier Baru</h2>
      <div className="grid-form">
        <input name="name" placeholder="Nama Supplier (ex: Pasar Puyuh)" required />
        <input name="contact" placeholder="Kontak / No HP (Opsional)" />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit">Simpan Supplier</button>
      </div>
    </form>
  );
}
