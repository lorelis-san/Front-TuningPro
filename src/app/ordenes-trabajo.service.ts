import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export interface RepuestoOrden {
  id: number;
  piezaId: number;
  piezaCodigo: string;
  piezaNombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenTrabajo {
  id: number;
  codigo: string;
  proyectoId: number;
  proyectoCodigo: string;
  clienteNombre: string;
  vehiculoDescripcion: string;
  vehiculoPlaca: string;
  tecnicoNombre: string;
  problemasReportados: string[];
  repuestos: RepuestoOrden[];
  manoObra: number;
  observaciones: string;
  fechaCreacion: string;
  estado: 'Registrado' | 'En proceso' | 'Finalizado';
}

export interface TecnicoOpcion { id: number; nombreCompleto: string; }

export interface PiezaCompatible {
  id: number;
  codigo: string;
  nombre: string;
  precioUnitario: number;
  stock: number;
}

export interface DatosNuevaOrden {
  numeroSugerido: number;
  codigoSugerido: string;
  proyectoId: number;
  proyectoCodigo: string;
  clienteNombre: string;
  vehiculoDescripcion: string;
  vehiculoPlaca: string;
  problemasReportados: string[];
  tecnicos: TecnicoOpcion[];
  repuestosCompatibles: PiezaCompatible[];
}

export interface RepuestoSeleccionado { piezaId: number; cantidad: number; }

export interface CrearOrdenTrabajo {
  proyectoId: number;
  tecnicoId: number;
  manoObra: number;
  observaciones: string;
  repuestos: RepuestoSeleccionado[];
}

@Injectable({ providedIn: 'root' })
export class OrdenesTrabajoService {
  private api = API_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdenTrabajo[]> {
    return this.http.get<OrdenTrabajo[]>(`${this.api}/ordenes-trabajo`);
  }

  getById(id: number): Observable<OrdenTrabajo> {
    return this.http.get<OrdenTrabajo>(`${this.api}/ordenes-trabajo/${id}`);
  }

  obtenerDatosNueva(proyectoId: number): Observable<DatosNuevaOrden> {
    return this.http.get<DatosNuevaOrden>(`${this.api}/ordenes-trabajo/nueva/${proyectoId}`);
  }

  crear(dto: CrearOrdenTrabajo): Observable<OrdenTrabajo> {
    return this.http.post<OrdenTrabajo>(`${this.api}/ordenes-trabajo`, dto);
  }

  cambiarEstado(id: number, estado: string): Observable<OrdenTrabajo> {
    return this.http.put<OrdenTrabajo>(`${this.api}/ordenes-trabajo/${id}/estado`, { estado });
  }
}

// Cálculo de costos: el IGV (18%) solo aplica a los repuestos, no a la mano de obra
export function subtotalRepuestos(repuestos: { cantidad: number; precioUnitario: number }[]): number {
  return repuestos.reduce((acc, r) => acc + r.cantidad * r.precioUnitario, 0);
}
export function igv(subtotal: number): number {
  return Math.round(subtotal * 0.18 * 100) / 100;
}
export function totalGeneral(subtotal: number, manoObra: number): number {
  return subtotal + igv(subtotal) + manoObra;
}