import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';

interface PortalVehiculo { id: number; placa: string; marca: string; modelo: string; anio: number; }
interface PortalDetalle {
  pieza: string; categoria: string; cantidad: number; precioUnitario: number; subtotal: number;
}
interface PortalOrden {
  fechaEmision: string; manoObra: number; totalPiezas: number; total: number;
}
interface PortalProyecto {
  id: number; nombre: string; vehiculo: string; estado: string;
  fechaRegistro: string; piezas: PortalDetalle[]; total: number; orden: PortalOrden | null;
}
interface PortalResumen { cliente: string; vehiculos: PortalVehiculo[]; proyectos: PortalProyecto[]; }

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.css']
})
export class PortalComponent implements OnInit {
  datos: PortalResumen | null = null;
  error = '';
  cargando = false;
  etapas = ['Registrado', 'En proceso', 'Finalizado'];

  constructor(private http: HttpClient) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.error = '';
    this.http.get<PortalResumen>(`${API_URL}/portal/mis-proyectos`).subscribe({
      next: d => { this.datos = d; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.error = e?.status === 0
          ? 'No se pudo conectar con la API.'
          : (e?.status === 401 ? 'Tu sesión expiró. Inicia sesión de nuevo.'
          : (e?.error?.mensaje ?? 'No se pudieron cargar tus proyectos.'));
      }
    });
  }

  indice(estado: string): number {
    if (estado === 'En pausa') return 1;   // sigue en la etapa "En proceso"
    const i = this.etapas.indexOf(estado);
    return i < 0 ? 0 : i;
  }

  esCerrado(estado: string): boolean {
    return estado === 'Cancelado' || estado === 'Rechazado';
  }
}