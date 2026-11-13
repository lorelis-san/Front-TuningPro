import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pieza, PiezasService, Vehiculo } from '../piezas/piezas.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit {
  private service = inject(PiezasService);
  auth = inject(AuthService);

  piezas: Pieza[] = [];
  vehiculos: Vehiculo[] = [];
  alertasIds = new Set<number>();

  vehiculoValidarId = 1;
  entradas: Record<number, number> = {};
  busqueda = '';

  mensaje = '';
  esError = false;

  get puedeValidar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }
  get puedeEntradas(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }

  get piezasFiltradas(): Pieza[] {
    const q = this.busqueda.trim().toLowerCase();
    return !q ? this.piezas
      : this.piezas.filter(p => [p.codigo, p.nombre, p.categoria].some(t => (t ?? '').toLowerCase().includes(q)));
  }

  ngOnInit(): void {
    this.recargarInventario();
    if (this.puedeValidar) {
      this.service.getVehiculos().subscribe({
        next: v => {
          this.vehiculos = v;
          if (v.length) this.vehiculoValidarId = v[0].id;
        },
        error: e => this.manejarError(e, 'No se pudieron cargar los vehículos.')
      });
    }
  }

  recargarInventario(): void {
    this.service.getPiezas().subscribe({
      next: p => (this.piezas = p),
      error: e => this.manejarError(e, 'No se pudo conectar con la API.')
    });
    this.service.getAlertas().subscribe({
      next: a => (this.alertasIds = new Set(a.map(x => x.id)))
    });
  }

  esStockBajo(p: Pieza): boolean {
    return this.alertasIds.has(p.id);
  }

  validar(piezaId: number): void {
    this.service.validar(Number(this.vehiculoValidarId), piezaId).subscribe({
      next: r => this.mostrar(r.mensaje, !r.esCompatible),
      error: e => this.manejarError(e, 'Error al validar.')
    });
  }

  registrarEntrada(p: Pieza): void {
    const cantidad = Number(this.entradas[p.id] ?? 0);
    if (cantidad < 1) {
      this.mostrar('Escribe una cantidad mayor a 0 para registrar la entrada.', true);
      return;
    }
    this.service.movimiento(p.id, cantidad, true).subscribe({
      next: () => {
        this.entradas[p.id] = 0;
        this.mostrar(`Entrada registrada: +${cantidad} de "${p.nombre}".`, false);
        this.recargarInventario();
      },
      error: e => this.manejarError(e, 'No se pudo registrar la entrada.')
    });
  }

  private mostrar(texto: string, esError: boolean): void {
    this.mensaje = texto;
    this.esError = esError;
  }

  private manejarError(err: any, porDefecto: string): void {
    if (err?.status === 0) this.mostrar('No se pudo conectar con la API. ¿Está corriendo?', true);
    else if (err?.status === 403) this.mostrar('Tu rol no tiene permiso para realizar esta acción.', true);
    else if (err?.status === 401) this.mostrar('Tu sesión expiró. Inicia sesión de nuevo.', true);
    else this.mostrar(err?.error?.mensaje ?? porDefecto, true);
  }
}