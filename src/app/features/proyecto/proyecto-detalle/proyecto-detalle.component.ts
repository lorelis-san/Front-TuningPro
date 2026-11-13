import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProyectoService } from '../proyecto.service';
import { AuthService } from '../../../core/services/auth.service';
import { Proyecto } from '../../../shared/models/proyecto.model';

@Component({
  selector: 'app-proyecto-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './proyecto-detalle.component.html',
  styleUrl: './proyecto-detalle.component.css'
})
export class ProyectoDetalleComponent implements OnInit {
  private api = inject(ProyectoService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  proyecto = signal<Proyecto | null>(null);
  cargando = signal(true);
  error = signal('');

  modalAbierto = signal(false);
  cancelando = signal(false);
  errorCancelar = signal('');

  tieneOrden = computed(() => !!this.proyecto()?.ordenId);
  cancelado = computed(() => this.proyecto()?.estado === 'Cancelado');
  finalizado = computed(() => this.proyecto()?.estado === 'Finalizado');

  puedeGestionarOT = computed(() => this.auth.puede('Administrador', 'Tecnico'));
  puedeCancelar = computed(() =>
    this.auth.puede('Administrador') && !this.cancelado() && !this.finalizado());

  ngOnInit(): void {
    this.cargar(Number(this.route.snapshot.paramMap.get('id')));
  }

  private cargar(id: number): void {
    this.api.obtener(id).subscribe({
      next: p => { this.proyecto.set(p); this.cargando.set(false); },
      error: e => {
        this.cargando.set(false);
        this.error.set(e.status === 404 ? 'El proyecto no existe.' : 'No se pudo cargar el proyecto.');
      }
    });
  }

  abrirModal(): void { this.errorCancelar.set(''); this.modalAbierto.set(true); }
  cerrarModal(): void { if (!this.cancelando()) this.modalAbierto.set(false); }

  confirmarCancelacion(): void {
    const p = this.proyecto();
    if (!p) return;
    this.cancelando.set(true);
    this.errorCancelar.set('');
    this.api.cancelar(p.id).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.modalAbierto.set(false);
        this.cargar(p.id);          // recarga: estado, orden y total actualizados
      },
      error: e => {
        this.cancelando.set(false);
        this.errorCancelar.set(e?.error?.mensaje ?? 'No se pudo cancelar el proyecto.');
      }
    });
  }
}