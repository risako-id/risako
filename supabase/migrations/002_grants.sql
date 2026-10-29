-- Jalankan HANYA jika muncul error "permission denied for table ..."
-- (terjadi bila "Automatically expose new tables" dimatikan).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
