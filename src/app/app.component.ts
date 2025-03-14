import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapaComponent } from "./mapa/mapa.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MapaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = '01proyecto';
}
