import { getCurrentEmployee } from "@/lib/auth/role";
import { redirect } from "next/navigation";
import FormGantiPassword from "@/components/profil/FormGantiPassword";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  return (
    <div>
      <h1>Profil Saya</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <p style={{ margin: 0, color: '#666' }}>Nama Lengkap</p>
        <h2 style={{ margin: '5px 0 15px 0' }}>{employee.name}</h2>
        
        <p style={{ margin: 0, color: '#666' }}>Divisi / Role</p>
        <h3 style={{ margin: '5px 0 0 0', textTransform: 'capitalize' }}>{employee.role}</h3>
      </div>

      <FormGantiPassword />
    </div>
  );
}
