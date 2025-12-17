import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Las rutas protegidas requieren autenticación
  const protectedRoutes = ['/turnos', '/locales', '/personal'];
  const authRoutes = ['/login', '/register'];

  const { pathname } = request.nextUrl;

  // Si es una ruta protegida, verificar autenticación
  // Nota: Firebase Auth en el cliente no permite verificación en middleware
  // Por lo tanto, la protección real se hará en los componentes
  // Este middleware es solo para organización de rutas

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
