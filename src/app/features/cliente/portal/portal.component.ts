import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../../core/config/api.config';

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
export class PortalComponent implements OnInit, OnDestroy {
  datos: PortalResumen | null = null;
  error = '';
  cargando = false;
  etapas = ['Registrado', 'En proceso', 'Finalizado'];

  // Proyectos que el cliente abrió o cerró a mano
  private manual = new Map<number, boolean>();
  private timer?: ReturnType<typeof setInterval>;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargar();
    // Se actualiza solo cada 30 segundos
    this.timer = setInterval(() => this.cargar(true), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  cargar(silencioso = false) {
    if (!silencioso) {
      this.cargando = true;
      this.error = '';
    }
    this.http.get<PortalResumen>(`${API_URL}/portal/mis-proyectos`).subscribe({
      next: d => { this.datos = d; this.cargando = false; this.error = ''; },
      error: e => {
        this.cargando = false;
        if (silencioso) return;   // en la actualización automática no se muestra error
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

  // Los proyectos activos se muestran abiertos; los cerrados, plegados
  estaAbierto(p: { id: number; estado: string }): boolean {
    return this.manual.get(p.id) ?? !this.esCerrado(p.estado);
  }

  alternar(p: { id: number; estado: string }) {
    this.manual.set(p.id, !this.estaAbierto(p));
  }

  get resumen() {
    const ps = this.datos?.proyectos ?? [];
    return {
      enCurso: ps.filter(p => ['Registrado', 'En proceso', 'En pausa'].includes(p.estado)).length,
      finalizados: ps.filter(p => p.estado === 'Finalizado').length
    };
  }

  subtotalPiezas(p: { piezas: { subtotal: number }[] }): number {
    return p.piezas.reduce((s, d) => s + d.subtotal, 0);
  }

  mensajeEstado(estado: string): string {
    switch (estado) {
      case 'Registrado': return 'Recibimos tu proyecto. El taller comenzará el trabajo pronto.';
      case 'En proceso': return 'El taller está trabajando en tu vehículo.';
      case 'Finalizado': return 'Tu proyecto terminó. Coordina con el taller el recojo de tu vehículo.';
      case 'En pausa':   return 'Tu proyecto está en pausa. Consulta con el taller cuándo se reanuda.';
      case 'Cancelado':  return 'Este proyecto fue cancelado. Consulta en el taller para más información.';
      case 'Rechazado':  return 'Este proyecto fue rechazado. Consulta en el taller para más información.';
      default: return '';
    }
  }
}