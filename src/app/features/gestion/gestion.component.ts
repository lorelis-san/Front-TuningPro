import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculosComponent } from '../vehiculos/vehiculos.component';
import { CatalogoPiezasComponent } from '../piezas/catalogo-piezas/catalogo-piezas.component';
import { ProveedoresComponent } from '../proveedores/proveedores.component';
import { CompatibilidadesComponent } from '../piezas/compatibilidades/compatibilidades.component';
import { AuthService } from '../../core/services/auth.service';

type Pestana = 'vehiculos' | 'piezas' | 'proveedores' | 'compatibilidades';

interface PestanaDef { id: Pestana; texto: string; roles: string[]; }

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, VehiculosComponent, CatalogoPiezasComponent, ProveedoresComponent, CompatibilidadesComponent],
  templateUrl: './gestion.component.html',
  styleUrls: ['./gestion.component.css']
})
export class GestionComponent {
  @Output() cambio = new EventEmitter<void>();

  private todas: PestanaDef[] = [
    { id: 'vehiculos', texto: 'Vehículos', roles: ['Administrador', 'Recepcionista'] },
    { id: 'piezas', texto: 'Piezas', roles: ['Administrador', 'Auxiliar'] },
    { id: 'proveedores', texto: 'Proveedores', roles: ['Administrador', 'Auxiliar'] },
    { id: 'compatibilidades', texto: 'Compatibilidades', roles: ['Administrador', 'Tecnico'] }
  ];

  pestanas: PestanaDef[] = [];
  activa: Pestana = 'vehiculos';

  constructor(private auth: AuthService) {
    this.pestanas = this.todas.filter(t => this.auth.puede(...t.roles));
    if (this.pestanas.length) this.activa = this.pestanas[0].id;
  }

  visible(id: Pestana): boolean {
    return this.pestanas.some(t => t.id === id);
  }
}