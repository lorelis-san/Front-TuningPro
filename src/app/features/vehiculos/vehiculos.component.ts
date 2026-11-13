import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/errores';

interface VehiculoItem {
  id: number; placa: string; marca: string; modelo: string; anio: number;
  clienteNombre: string; usuarioId: number | null;
}
interface ClienteCuenta { id: number; nombreUsuario: string; nombreCompleto: string; }

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.css']
})
export class VehiculosComponent implements OnInit {
  @Output() cambio = new EventEmitter<void>();

  vehiculos: VehiculoItem[] = [];
  clientes: ClienteCuenta[] = [];
  buscar = '';

  id: number | null = null;
  placa = '';
  marca = '';
  modelo = '';
  anio: number | null = null;
  clienteNombre = '';
  usuarioId: number | null = null;

  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeEditar(): boolean { return this.auth.puede('Administrador', 'Recepcionista'); }

  ngOnInit() {
    this.cargar();
    if (this.puedeEditar) {
      this.http.get<ClienteCuenta[]>(`${API_URL}/vehiculos/clientes`).subscribe({
        next: c => (this.clientes = c),
        error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar las cuentas de cliente.'), true)
      });
    }
  }

  cargar() {
    const params: Record<string, string> = {};
    if (this.buscar.trim()) params['buscar'] = this.buscar.trim();

    this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`, { params }).subscribe({
      next: v => (this.vehiculos = v),
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los vehículos.'), true)
    });
  }

  limpiarBusqueda() {
    this.buscar = '';
    this.cargar();
  }

  cuenta(v: VehiculoItem): string {
    const c = this.clientes.find(x => x.id === v.usuarioId);
    return c ? c.nombreUsuario : 'Vinculado';
  }

  editar(v: VehiculoItem) {
    this.id = v.id;
    this.placa = v.placa;
    this.marca = v.marca;
    this.modelo = v.modelo;
    this.anio = v.anio;
    this.clienteNombre = v.clienteNombre;
    this.usuarioId = v.usuarioId;
    this.mensaje = '';
  }

  limpiar() {
    this.id = null;
    this.placa = '';
    this.marca = '';
    this.modelo = '';
    this.anio = null;
    this.clienteNombre = '';
    this.usuarioId = null;
  }

  guardar() {
    const cuerpo = {
      placa: this.placa, marca: this.marca, modelo: this.modelo,
      anio: Number(this.anio ?? 0), clienteNombre: this.clienteNombre,
      usuarioId: this.usuarioId
    };
    const eraNuevo = this.id == null;
    const peticion = eraNuevo
      ? this.http.post<VehiculoItem>(`${API_URL}/vehiculos`, cuerpo)
      : this.http.put<VehiculoItem>(`${API_URL}/vehiculos/${this.id}`, cuerpo);

    peticion.subscribe({
      next: v => {
        this.mostrar(eraNuevo ? `Vehículo ${v.placa} registrado.` : `Vehículo ${v.placa} actualizado.`, false);
        this.limpiar();
        this.cargar();
        this.cambio.emit();
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudo guardar el vehículo.'), true)
    });
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}