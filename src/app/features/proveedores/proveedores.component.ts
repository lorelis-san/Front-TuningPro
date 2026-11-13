import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/errores';

interface ProveedorItem { id: number; nombre: string; contacto: string; }

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  proveedores: ProveedorItem[] = [];
  id: number | null = null;
  nombre = '';
  contacto = '';
  busqueda = '';

  cargando = false;
  guardando = false;
  mensaje = '';
  esError = false;
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }

  get puedeGuardar(): boolean { return this.nombre.trim().length > 0 && !this.guardando; }

  get filtrados(): ProveedorItem[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.proveedores;
    return this.proveedores.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.contacto ?? '').toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  }

  ngOnInit() { this.cargar(); }

  porId(_: number, p: ProveedorItem) { return p.id; }

  cargar() {
    this.cargando = true;
    this.http.get<ProveedorItem[]>(`${API_URL}/proveedores`).subscribe({
      next: p => { this.proveedores = p; this.cargando = false; },
      error: e => {
        this.cargando = false;
        this.mostrar(mensajeError(e, 'No se pudieron cargar los proveedores.'), true);
      }
    });
  }

  editar(p: ProveedorItem) {
    this.id = p.id;
    this.nombre = p.nombre;
    this.contacto = p.contacto;
    this.mensaje = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  limpiar() {
    this.id = null;
    this.nombre = '';
    this.contacto = '';
  }

  guardar() {
    if (!this.puedeGuardar) return;

    const cuerpo = { nombre: this.nombre.trim(), contacto: this.contacto.trim() };
    const eraNuevo = this.id == null;
    const peticion = eraNuevo
      ? this.http.post<ProveedorItem>(`${API_URL}/proveedores`, cuerpo)
      : this.http.put<ProveedorItem>(`${API_URL}/proveedores/${this.id}`, cuerpo);

    this.guardando = true;
    peticion.subscribe({
      next: p => {
        this.guardando = false;
        this.mostrar(eraNuevo ? `Proveedor "${p.nombre}" registrado.` : `Proveedor "${p.nombre}" actualizado.`, false);
        this.limpiar();
        this.cargar();
        this.cambio.emit();
      },
      error: e => {
        this.guardando = false;
        this.mostrar(mensajeError(e, 'No se pudo guardar el proveedor.'), true);
      }
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
    clearTimeout(this.temporizador);
    if (!esError) this.temporizador = setTimeout(() => (this.mensaje = ''), 4000);
  }
}