import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { mensajeError } from '../../core/errores';

interface VehiculoItem { id: number; placa: string; marca: string; modelo: string; clienteNombre: string; }

interface HistorialPieza {
  codigo: string; pieza: string; categoria: string; marca: string;
  cantidad: number; precioUnitario: number; subtotal: number;
}
interface HistorialOrden {
  id: number; fechaEmision: string; manoObra: number; totalPiezas: number; total: number; emitidaPor: string;
}
interface HistorialProyecto {
  id: number; nombre: string; estado: string; fechaRegistro: string;
  piezas: HistorialPieza[]; totalPiezas: number; orden: HistorialOrden | null;
}
interface Historial {
  id: number; placa: string; marca: string; modelo: string; anio: number; cliente: string;
  totalProyectos: number; totalPiezasInstaladas: number; inversionTotal: number;
  proyectos: HistorialProyecto[];
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  vehiculos: VehiculoItem[] = [];
  vehiculoId: number | null = null;
  historial: Historial | null = null;

  mensaje = '';
  cargando = false;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.cargarVehiculos(); }

  cargarVehiculos() {
    this.cargando = true;
    this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`).subscribe({
      next: v => {
        this.vehiculos = v;
        if (!v.some(x => x.id === this.vehiculoId)) {
          this.vehiculoId = v.length ? v[0].id : null;
        }
        this.cargarHistorial();
      },
      error: e => {
        this.cargando = false;
        this.mensaje = mensajeError(e, 'No se pudieron cargar los vehículos.');
      }
    });
  }

  elegir(id: number) {
    this.vehiculoId = id;
    this.cargarHistorial();
  }

  cargarHistorial() {
    if (this.vehiculoId == null) {
      this.historial = null;
      this.cargando = false;
      return;
    }
    this.mensaje = '';
    this.http.get<Historial>(`${API_URL}/historial/${this.vehiculoId}`).subscribe({
      next: h => { this.historial = h; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.historial = null;
        this.mensaje = mensajeError(e, 'No se pudo cargar el historial.');
      }
    });
  }

  codigoOrden(id: number): string {
    return 'OT-' + String(id).padStart(4, '0');
  }
}