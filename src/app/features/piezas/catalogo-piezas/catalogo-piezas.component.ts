import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeError } from '../../../core/errores';

interface PiezaItem {
  id: number; codigo: string; nombre: string; marca: string; categoria: string;
  stock: number; precioUnitario: number; proveedorId: number;
}
interface ProveedorItem { id: number; nombre: string; contacto: string; }

@Component({
  selector: 'app-catalogo-piezas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-piezas.component.html',
  styleUrls: ['./catalogo-piezas.component.css']
})
export class CatalogoPiezasComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  categorias = ['Frenos', 'Suspensión', 'Turbo', 'General'];

  piezas: PiezaItem[] = [];
  proveedores: ProveedorItem[] = [];

  id: number | null = null;
  codigo = '';
  nombre = '';
  marca = '';
  categoria = 'Frenos';
  stock: number | null = 0;
  precio: number | null = null;
  proveedorId: number | null = null;

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }

  ngOnInit() { this.cargar(); }

  cargar() {
    forkJoin({
      piezas: this.http.get<PiezaItem[]>(`${API_URL}/piezas`),
      proveedores: this.http.get<ProveedorItem[]>(`${API_URL}/proveedores`)
    }).subscribe({
      next: r => {
        this.piezas = r.piezas;
        this.proveedores = r.proveedores;
        if (this.proveedorId == null && r.proveedores.length) this.proveedorId = r.proveedores[0].id;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo cargar el catálogo.'), true)
    });
  }

  nombreProveedor(id: number): string {
    return this.proveedores.find(p => p.id === id)?.nombre ?? `Proveedor #${id}`;
  }

  editar(p: PiezaItem) {
    this.id = p.id;
    this.codigo = p.codigo;
    this.nombre = p.nombre;
    this.marca = p.marca;
    this.categoria = p.categoria;
    this.stock = p.stock;
    this.precio = p.precioUnitario;
    this.proveedorId = p.proveedorId;
    this.mensaje = '';
  }

  limpiar() {
    this.id = null;
    this.codigo = '';
    this.nombre = '';
    this.marca = '';
    this.categoria = 'Frenos';
    this.stock = 0;
    this.precio = null;
    this.proveedorId = this.proveedores.length ? this.proveedores[0].id : null;
  }

  guardar() {
    if (this.proveedorId == null) {
      this.mostrar('Selecciona un proveedor.', true);
      return;
    }
    const cuerpo = {
      codigo: this.codigo, nombre: this.nombre, marca: this.marca, categoria: this.categoria,
      stock: Number(this.stock ?? 0), precioUnitario: Number(this.precio ?? 0),
      proveedorId: this.proveedorId
    };
    const eraNueva = this.id == null;
    const peticion = eraNueva
      ? this.http.post<PiezaItem>(`${API_URL}/piezas`, cuerpo)
      : this.http.put<PiezaItem>(`${API_URL}/piezas/${this.id}`, cuerpo);

    peticion.subscribe({
      next: p => {
        this.mostrar(eraNueva ? `Pieza "${p.nombre}" registrada.` : `Pieza "${p.nombre}" actualizada.`, false);
        this.limpiar();
        this.cargar();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo guardar la pieza.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}