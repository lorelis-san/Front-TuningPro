import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OrdenesTrabajoService, OrdenTrabajo, subtotalRepuestos, igv, totalGeneral } from '../ordenes-trabajo.service';

@Component({
  selector: 'app-ot-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ot-detalle.component.html',
  styleUrl: './ot-detalle.component.css'
})
export class OtDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(OrdenesTrabajoService);
  auth = inject(AuthService);

  estados: OrdenTrabajo['estado'][] = ['Registrado', 'En proceso', 'Finalizado'];

  orden = signal<OrdenTrabajo | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  aviso = signal('');

  subtotal = computed(() => subtotalRepuestos(this.orden()?.repuestos ?? []));
  montoIgv = computed(() => igv(this.subtotal()));
  total = computed(() => totalGeneral(this.subtotal(), this.orden()?.manoObra ?? 0));

  get puedeCambiarEstado(): boolean {
    return this.auth.puede('Administrador', 'Tecnico');
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (o) => { this.orden.set(o); this.cargando.set(false); },
      error: (err) => {
        this.error.set(err?.error?.mensaje ?? 'No se pudo cargar la orden de trabajo.');
        this.cargando.set(false);
      }
    });
  }

  cambiarEstado(nuevo: OrdenTrabajo['estado']): void {
    const actual = this.orden();
    if (!actual || !this.puedeCambiarEstado || this.guardando() || actual.estado === nuevo) return;

    this.guardando.set(true);
    this.aviso.set('');
    this.service.cambiarEstado(actual.id, nuevo).subscribe({
      next: (o) => {
        this.orden.set(o);
        this.guardando.set(false);
        this.aviso.set(`Estado actualizado a "${nuevo}".`);
      },
      error: (err) => {
        this.aviso.set(err?.error?.mensaje ?? 'No se pudo actualizar el estado.');
        this.guardando.set(false);
      }
    });
  }

  claseEstado(estado: string): string {
    return estado === 'Finalizado' ? 'finalizado' : estado === 'En proceso' ? 'proceso' : 'registrado';
  }
}