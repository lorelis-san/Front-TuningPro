import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/errores';

interface VehiculoItem { id: number; placa: string; marca: string; modelo: string; clienteNombre: string; }

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  vehiculos: VehiculoItem[] = [];
  vehiculoId: number | null = null;

  ocupado: string | null = null;
  mensaje = '';
  esError = false;

  constructor(private http: HttpClient, public auth: AuthService) {}

  get puedeInventario(): boolean { return this.auth.puede('Administrador', 'Auxiliar'); }
  get puedeProyectos(): boolean { return this.auth.puede('Administrador', 'Tecnico', 'Recepcionista'); }

  ngOnInit() {
    this.http.get<VehiculoItem[]>(`${API_URL}/vehiculos`).subscribe({
      next: v => {
        this.vehiculos = v;
        if (v.length) this.vehiculoId = v[0].id;
      },
      error: e => this.mostrar(mensajeError(e, 'No se pudieron cargar los vehículos.'), true)
    });
  }

  generarHistorial(abrir: boolean) {
    if (this.vehiculoId == null) return;
    const v = this.vehiculos.find(x => x.id === this.vehiculoId);
    const nombre = 'historial-' + (v?.placa ?? 'vehiculo');
    this.generar('historial', `/reportes/historial/${this.vehiculoId}`, nombre, abrir);
  }

  generar(clave: string, ruta: string, nombre: string, abrir: boolean) {
    this.mensaje = '';
    this.ocupado = clave;
    // Se abre la pestaña de inmediato (con el clic) para que el navegador no la bloquee
    const ventana = abrir ? window.open('', '_blank') : null;

    this.http.get(`${API_URL}${ruta}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        this.ocupado = null;
        const url = URL.createObjectURL(blob);

        if (ventana) {
          ventana.location.href = url;
        } else {
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = `${nombre}-${this.fechaHoy()}.pdf`;
          enlace.click();
        }

        this.mostrar(ventana ? 'Reporte generado.' : 'Reporte descargado.', false);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: async e => {
        this.ocupado = null;
        ventana?.close();

        let texto = mensajeError(e, 'No se pudo generar el reporte.');
        // Con responseType blob, el mensaje de error de la API llega dentro de un Blob
        if (e?.error instanceof Blob) {
          try {
            const cuerpo = JSON.parse(await e.error.text());
            if (cuerpo?.mensaje) texto = cuerpo.mensaje;
          } catch { /* se deja el mensaje por defecto */ }
        }
        this.mostrar(texto, true);
      }
    });
  }

  private fechaHoy(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  private mostrar(texto: string, esError: boolean) {
    this.mensaje = texto;
    this.esError = esError;
  }
}