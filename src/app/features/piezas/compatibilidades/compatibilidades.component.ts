import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeError } from '../../../core/errores';

interface VehiculoItem { id: number; placa: string; marca: string; modelo: string; anio: number; }
interface PiezaItem { id: number; codigo: string; nombre: string; marca: string; categoria: string; stock: number; }

@Component({
  selector: 'app-compatibilidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compatibilidades.component.html',
  styleUrls: ['./compatibilidades.component.css']
})
export class CompatibilidadesComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  vehiculos: VehiculoItem[] = [];
  piezas: PiezaItem[] = [];
  compatibles: PiezaItem[] = [];

  vehiculoId: number | null = null;
  piezaId: number | null = null;

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Tecnico'); }

  get disponibles(): PiezaItem[] {
    return this.piezas.filter(p => !this.compatibles.some(c => c.id === p.id));
  }

  ngOnInit() {
    forkJoin({
      vehiculos: this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`),
      piezas: this.http.get<PiezaItem[]>(`${API_URL}/piezas`)
    }).subscribe({
      next: r => {
        this.vehiculos = r.vehiculos;
        this.piezas = r.piezas;
        if (r.vehiculos.length) this.elegirVehiculo(r.vehiculos[0].id);
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los datos.'), true)
    });
  }

  elegirVehiculo(id: number) {
    this.vehiculoId = id;
    this.mensaje = '';
    this.cargarCompatibles();
  }

  cargarCompatibles() {
    if (this.vehiculoId == null) return;
    this.http.get<PiezaItem[]>(`${API_URL}/compatibilidad`, { params: { vehiculoId: this.vehiculoId } }).subscribe({
      next: c => {
        this.compatibles = c;
        this.piezaId = this.disponibles.length ? this.disponibles[0].id : null;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar las compatibilidades.'), true)
    });
  }

  agregar() {
    if (this.vehiculoId == null || this.piezaId == null) {
      this.mostrar('Selecciona un vehículo y una pieza.', true);
      return;
    }
    this.http.post(`${API_URL}/compatibilidad`, { vehiculoId: this.vehiculoId, piezaId: this.piezaId }).subscribe({
      next: () => {
        this.mostrar('Compatibilidad registrada.', false);
        this.cargarCompatibles();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo registrar la compatibilidad.'), true)
    });
  }

  quitar(p: PiezaItem) {
    if (this.vehiculoId == null) return;
    if (!confirm(`¿Quitar "${p.nombre}" de las piezas compatibles de este vehículo?`)) return;

    this.http.delete(`${API_URL}/compatibilidad`, {
      params: { vehiculoId: this.vehiculoId, piezaId: p.id }
    }).subscribe({
      next: () => {
        this.mostrar('Compatibilidad eliminada.', false);
        this.cargarCompatibles();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo eliminar la compatibilidad.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}