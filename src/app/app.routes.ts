import { Routes } from '@angular/router';
import { MenuLayoutComponent } from './layout/menu-layout/menu-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { InventarioComponent } from './features/inventario/inventario.component';
import { OtListComponent } from './features/ordenes-trabajo/ot-list/ot-list.component';
import { OtNuevaComponent } from './features/ordenes-trabajo/ot-nueva/ot-nueva.component';
import { OtDetalleComponent } from './features/ordenes-trabajo/ot-detalle/ot-detalle.component';
import { HistorialComponent } from './features/historial/historial.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { GestionComponent } from './features/gestion/gestion.component';
import { ProyectoListComponent } from './features/proyecto/proyecto-list/proyecto-list.component';
import { ProyectoNuevoComponent } from './features/proyecto/proyecto-nuevo/proyecto-nuevo.component';
import { ProyectoDetalleComponent } from './features/proyecto/proyecto-detalle/proyecto-detalle.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { authGuard, soloInvitadoGuard } from './core/guards/auth.guard';
import { soloClienteGuard, soloPersonalGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [soloInvitadoGuard] },

  // Cliente: su propio layout, sin menú
  {
    path: 'portal',
    canActivate: [authGuard, soloClienteGuard],
    loadChildren: () => import('./features/cliente/cliente.routes').then(m => m.CLIENTE_ROUTES)
  },

  // Personal del taller: con menú
  {
    path: '',
    component: MenuLayoutComponent,
    canActivate: [authGuard, soloPersonalGuard],
    children: [
      { path: '', redirectTo: 'proyectos', pathMatch: 'full' },
      { path: 'inicio', component: InicioComponent },
      { path: 'inventario', component: InventarioComponent },
      { path: 'proyectos', component: ProyectoListComponent },
      { path: 'proyectos/nuevo', component: ProyectoNuevoComponent },
      { path: 'proyectos/:id', component: ProyectoDetalleComponent },
      { path: 'ordenes-trabajo', component: OtListComponent },
      { path: 'ordenes-trabajo/nueva/:proyectoId', component: OtNuevaComponent },
      { path: 'ordenes-trabajo/:id', component: OtDetalleComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'reportes', component: ReportesComponent },
      { path: 'gestion', component: GestionComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];