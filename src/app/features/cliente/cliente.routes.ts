import { Routes } from '@angular/router';
import { ClienteLayoutComponent } from './cliente-layout/cliente-layout.component';
import { PortalComponent } from './portal/portal.component';

export const CLIENTE_ROUTES: Routes = [
  {
    path: '',
    component: ClienteLayoutComponent,
    children: [{ path: '', component: PortalComponent }]
  }
];