import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-alabaster-grey-50 via-prussian-blue-50 to-dusk-blue-500/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">MDQApps Turnos</h1>
          <p className="text-muted-foreground">Gestión de turnos para empleados</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
