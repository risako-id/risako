"use client";

export default function FormValidasi({ 
  production_id, 
  penjualList, 
  action 
}: { 
  production_id: string, 
  penjualList: any[], 
  action: (fd: FormData) => void 
}) {
  return (
    <form action={action} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <input type="hidden" name="production_id" value={production_id} />
      
      <select name="validator_id" required style={{ padding: '6px', fontSize: '0.85rem' }}>
        <option value="">-- Siapa yang Validasi? --</option>
        {penjualList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <input name="waste_qty" type="number" placeholder="Qty Rusak (Waste)" defaultValue="0" min="0" style={{ width: '120px', padding: '6px', fontSize: '0.85rem' }} />
      <input name="waste_reason" placeholder="Alasan Rusak" style={{ padding: '6px', fontSize: '0.85rem' }} />

      <button type="submit" style={{ background: '#2e7d32', padding: '6px 12px', fontSize: '0.85rem' }}>
        Validasi
      </button>
    </form>
  );
}
