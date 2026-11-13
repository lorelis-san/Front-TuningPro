import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdenesTrabajoService, OrdenTrabajo, subtotalRepuestos, totalGeneral } from '../../ordenes-trabajo.service';

type Filtro = 'Todos' | 'Registrado' | 'En proceso' | 'Finalizado';

@Component({
  selector: 'app-ot-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ot-list.component.html',
  styleUrl: './ot-list.component.css'
})
export class OtListComponent implements OnInit {
  private service = inject(OrdenesTrabajoService);
  private route = inject(ActivatedRoute);

  filtros: Filtro[] = ['Todos', 'Registrado', 'En proceso', 'Finalizado'];

  ordenes = signal<OrdenTrabajo[]>([]);
  cargando = signal(true);
  error = signal('');
  filtro = signal<Filtro>('Todos');
  busqueda = signal('');
  proyectoId = signal<number | null>(null);

  // Si se llega desde un proyecto (?proyectoId=5) solo se muestra su OT
  private base = computed(() => {
    const pid = this.proyectoId();
    return pid ? this.ordenes().filter(o => o.proyectoId === pid) : this.ordenes();
  });

  filtradas = computed(() => {
    const f = this.filtro();
    const q = this.busqueda().trim().toLowerCase();
    return this.base()
      .filter(o => f === 'Todos' || o.estado === f)
      .filter(o => !q || [o.codigo, o.proyectoCodigo, o.clienteNombre, o.vehiculoPlaca, o.vehiculoDescripcion]
        .some(t => t.toLowerCase().includes(q)));
  });

  ngOnInit(): void {
    const pid = this.route.snapshot.queryParamMap.get('proyectoId');
    this.proyectoId.set(pid ? Number(pid) : null);

    this.service.getAll().subscribe({
      next: (datos) => { this.ordenes.set(datos); this.cargando.set(false); },
      error: (err) => {
        this.error.set(err?.error?.mensaje ?? 'No se pudieron cargar las órdenes de trabajo.');
        this.cargando.set(false);
      }
    });
  }

  conteo(f: Filtro): number {
    return f === 'Todos' ? this.base().length : this.base().filter(o => o.estado === f).length;
  }

  monto(o: OrdenTrabajo): number {
    return totalGeneral(subtotalRepuestos(o.repuestos), o.manoObra);
  }

  claseEstado(estado: string): string {
    return estado === 'Finalizado' ? 'finalizado' : estado === 'En proceso' ? 'proceso' : 'registrado';
  }
}