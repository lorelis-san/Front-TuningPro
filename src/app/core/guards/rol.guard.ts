import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Solo clientes: si entra personal del taller, lo manda al sistema
export const soloClienteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.puede('Cliente') ? true : router.createUrlTree(['/proyectos']);
};

// Solo personal: si entra un cliente, lo manda a su portal
export const soloPersonalGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.puede('Cliente') ? router.createUrlTree(['/portal']) : true;
};