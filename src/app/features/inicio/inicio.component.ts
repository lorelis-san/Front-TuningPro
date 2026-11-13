import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PiezasService } from '../piezas/piezas.service';
import { AuthService } from '../../core/services/auth.service';
import { OrdenesTrabajoService, OrdenTrabajo, subtotalRepuestos, totalGeneral } from '../ordenes-trabajo/ordenes-trabajo.service';

// Forma mínima que usa el dashboard (con respaldos por si algún campo se llama distinto)
interface ProyectoLite {
  id: number; codigo?: string; estado?: string; vehiculoId?: number;
  fechaIngreso?: string; fechaRegistro?: string;
  cliente?: string; vehiculo?: string; placa?: string;
}
interface VehiculoLite { id: number; placa: string; marca: string; modelo: string; clienteNombre?: string; }

const CIRCUNFERENCIA = 2 * Math.PI * 52;

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  private piezas = inject(PiezasService);
  private ordenesSrv = inject(OrdenesTrabajoService);
  auth = inject(AuthService);

  proyectos = signal<ProyectoLite[]>([]);
  vehiculos = signal<VehiculoLite[]>([]);
  ordenes = signal<OrdenTrabajo[]>([]);
  cargando = signal(true);

  get puedeCrearProyecto(): boolean {
    return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista');
  }

  get saludo(): string {
    const h = new Date().getHours();
    const momento = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    const nombre = this.auth.sesion?.nombreCompleto?.split(' ')[0];
    return `${momento}, ${nombre ?? 'bienvenido'}`;
  }

  ngOnInit(): void {
    // Cada rol ve lo que su API permite: si una llamada falla, esa parte queda vacía
    forkJoin({
      proyectos: this.piezas.getProyectos().pipe(catchError(() => of([]))),
      vehiculos: this.piezas.getVehiculos().pipe(catchError(() => of([]))),
      ordenes: this.ordenesSrv.getAll().pipe(catchError(() => of([])))
    }).subscribe(r => {
      this.proyectos.set(r.proyectos as unknown as ProyectoLite[]);
      this.vehiculos.set(r.vehiculos as unknown as VehiculoLite[]);
      this.ordenes.set(r.ordenes as OrdenTrabajo[]);
      this.cargando.set(false);
    });
  }

  private fechaDe(p: ProyectoLite): Date | null {
    const f = p.fechaIngreso ?? p.fechaRegistro;
    return f ? new Date(f) : null;
  }

  // ---------- Tarjetas ----------
  totalProyectos = computed(() => this.proyectos().length);

  proyectosSemana = computed(() => {
    const limite = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.proyectos().filter(p => (this.fechaDe(p)?.getTime() ?? 0) >= limite).length;
  });

  ordenesActivas = computed(() => this.ordenes().filter(o => o.estado !== 'Finalizado').length);
  ordenesPorIniciar = computed(() => this.ordenes().filter(o => o.estado === 'Registrado').length);

  vehiculosAtendidos = computed(() =>
    new Set(this.proyectos().map(p => p.vehiculoId).filter(v => v != null)).size);

  facturacion = computed(() =>
    this.ordenes().reduce((acc, o) => acc + totalGeneral(subtotalRepuestos(o.repuestos), o.manoObra), 0));

  // ---------- Proyectos recientes ----------
  recientes = computed(() => {
    const ordenPorProyecto = new Map(this.ordenes().map(o => [o.proyectoId, o]));
    return [...this.proyectos()]
      .sort((a, b) => (this.fechaDe(b)?.getTime() ?? 0) - (this.fechaDe(a)?.getTime() ?? 0))
      .slice(0, 5)
      .map(p => {
        const v = this.vehiculos().find(x => x.id === p.vehiculoId);
        return {
          id: p.id,
          codigo: p.codigo ?? `PRY-${String(p.id).padStart(6, '0')}`,
          cliente: p.cliente ?? v?.clienteNombre ?? '—',
          vehiculo: p.vehiculo ?? (v ? `${v.marca} ${v.modelo}` : '—'),
          placa: p.placa ?? v?.placa ?? '',
          fecha: this.fechaDe(p),
          estado: ordenPorProyecto.get(p.id)?.estado ?? 'Sin orden'
        };
      });
  });

  // ---------- Dona: estado de órdenes ----------
  estados = [
    { nombre: 'Registrado', color: '#3b82f6' },
    { nombre: 'En proceso', color: '#f59e0b' },
    { nombre: 'Finalizado', color: '#10b981' }
  ];

  conteo(estado: string): number {
    return this.ordenes().filter(o => o.estado === estado).length;
  }

  segmentos = computed(() => {
    const total = this.ordenes().length;
    let acumulado = 0;
    return this.estados.map(e => {
      const largo = total ? (this.conteo(e.nombre) / total) * CIRCUNFERENCIA : 0;
      const seg = { color: e.color, dash: `${largo} ${CIRCUNFERENCIA - largo}`, offset: -acumulado };
      acumulado += largo;
      return seg;
    });
  });

  claseEstado(estado: string): string {
    return estado === 'Finalizado' ? 'finalizado' : estado === 'En proceso' ? 'proceso'
      : estado === 'Registrado' ? 'registrado' : 'sin-orden';
  }
}