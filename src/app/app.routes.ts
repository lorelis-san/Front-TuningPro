import { Routes } from '@angular/router';
import { MenuLayoutComponent } from './layout/menu-layout/menu-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { PortalComponent } from './features/portal/portal.component';
import { OtListComponent } from './features/ordenes-trabajo/ot-list/ot-list.component';
import { OtNuevaComponent } from './features/ordenes-trabajo/ot-nueva/ot-nueva.component';
import { OtDetalleComponent } from './features/ordenes-trabajo/ot-detalle/ot-detalle.component';
import { HistorialComponent } from './features/historial/historial.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { GestionComponent } from './features/gestion/gestion.component';
import { ProyectoListComponent } from './features/proyecto/proyecto-list/proyecto-list.component';
import { ProyectoNuevoComponent } from './features/proyecto/proyecto-nuevo/proyecto-nuevo.component';
import { ProyectoDetalleComponent } from './features/proyecto/proyecto-detalle/proyecto-detalle.component';
import { authGuard, soloInvitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [soloInvitadoGuard] },
  {
    path: '',
    component: MenuLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'proyectos', pathMatch: 'full' },
      { path: 'proyectos', component: ProyectoListComponent },
      { path: 'proyectos/nuevo', component: ProyectoNuevoComponent },
      { path: 'proyectos/:id', component: ProyectoDetalleComponent },
      { path: 'ordenes-trabajo', component: OtListComponent },
      { path: 'ordenes-trabajo/nueva/:proyectoId', component: OtNuevaComponent },
      { path: 'ordenes-trabajo/:id', component: OtDetalleComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'reportes', component: ReportesComponent },
      { path: 'gestion', component: GestionComponent },
      { path: 'portal', component: PortalComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];