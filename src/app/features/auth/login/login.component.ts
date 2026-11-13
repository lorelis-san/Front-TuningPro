import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  @Output() ingreso = new EventEmitter<void>();
  usuario = '';
  password = '';
  error = '';
  cargando = false;
  mostrarPassword = false;
  anio = new Date().getFullYear();

  constructor(private auth: AuthService, private router: Router) {}

  entrar() {
    if (!this.usuario.trim() || !this.password) {
      this.error = 'Escribe tu usuario y contraseña.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.auth.login(this.usuario.trim(), this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.password = '';
        this.ingreso.emit();
        this.router.navigate(['/proyectos']);
      },
      error: e => {
        this.cargando = false;
        this.error = e?.status === 0
          ? 'No se pudo conectar con la API.'
          : (e?.error?.mensaje ?? 'No se pudo iniciar sesión.');
      }
    });
  }
}