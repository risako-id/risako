export default function FilterLogistik({ searchId, startDate, endDate, statusFilter }: any) {
  return (
    <div className="card" style={{ padding: '15px', marginBottom: '15px' }}>
      <form method="GET" action="/pesanan" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input type="hidden" name="tab" value="logistik" />
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Cari ID Pesanan</label>
          <input type="text" name="searchId" placeholder="Contoh: 5873..." defaultValue={searchId} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Dari Tanggal</label>
          <input type="date" name="startDate" defaultValue={startDate} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Sampai Tanggal</label>
          <input type="date" name="endDate" defaultValue={endDate} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Status</label>
          <select name="status" defaultValue={statusFilter} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Semua Status</option>
            <option value="AWAITING_COLLECTION">Awaiting Collection</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
        <div>
          <button type="submit" style={{ padding: '9px 15px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Filter</button>
          <a href="/pesanan?tab=logistik" style={{ padding: '9px 15px', marginLeft: '5px', background: '#e0e0e0', color: '#333', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>Reset</a>
        </div>
      </form>
    </div>
  );
}
