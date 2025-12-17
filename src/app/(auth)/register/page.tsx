import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">MDQApps Turnos</h1>
          <p className="text-muted-foreground">Gestión de turnos para empleados</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
