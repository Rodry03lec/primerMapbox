import { Component, OnInit } from '@angular/core';

import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-mapa',
  imports: [],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.scss',
})
export class MapaComponent implements OnInit {

   mapa!: mapboxgl.Map; // Variable para almacenar el mapa

  ngOnInit(): void {
    (mapboxgl as any).default.accessToken = environment.tokenMapbox;

    const bounds: mapboxgl.LngLatBoundsLike = [
      [-81.332, -55.03],  // Suroeste de Sudamérica (aproximación)
      [-34.793, 13.333],  // Noreste de Sudamérica (aproximación)
    ];

    this.mapa = new mapboxgl.Map({
      container: 'mapas',
      style: 'mapbox://styles/mapbox/streets-v10',
      center: [-64.968, -16.29], // Centro aproximado de Bolivia
      maxZoom: 16,       // Ajusta el nivel máximo de zoom
      minZoom: 5,       // Ajusta el nivel mínimo de zoom
      maxBounds: bounds, // Limita la vista a Bolivia
    });

    //this.addGeoServerLayer(this.mapa);  // Capa WMS (Raster) de GeoServer
    this.addGeoJSONLayer(this.mapa);   // Capa GeoJSON de GeoServer
  }

  // Método para añadir la capa WMS desde GeoServer
  addGeoServerLayer(map: mapboxgl.Map) {
    map.on('load', () => {
      map.addSource('geoserver-wms-layer', {
        type: 'raster',
        tiles: [
          'https://geo.gob.bo/geoserver/geonode/ows?service=WMS&version=1.1.1&request=GetMap&layers=geonode:15_uc_jaguar&bbox=-69.5,-23.0,-69.0,-22.5&width=256&height=256&srs=EPSG:4326&format=image/png&transparent=true'
        ],
        tileSize: 256
      });

      map.addLayer({
        id: 'geoserver-wms-layer',
        type: 'raster',
        source: 'geoserver-wms-layer',
        paint: {
          'raster-opacity': 0.7  // Control de opacidad
        }
      });
    });
  }

  // Método para añadir la capa GeoJSON desde GeoServer
  /* addGeoJSONLayer(map: mapboxgl.Map) {
    fetch("https://geo.gob.bo/geoserver/geonode/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geonode%3Aareas_protegidaswgs84&maxFeatures=50&outputFormat=application%2Fjson")
      .then(response => response.json())
      .then(data => {
        map.on('load', () => {
          // Añadir la fuente GeoJSON al mapa
          map.addSource('geoserver-geojson-layer', {
            type: 'geojson',
            data: data, // Los datos GeoJSON obtenidos de GeoServer
          });

          // Añadir la capa GeoJSON al mapa
          map.addLayer({
            id: 'geoserver-geojson-layer',
            type: 'fill',  // Tipo de capa (puede ser 'fill', 'line', 'circle', etc.)
            source: 'geoserver-geojson-layer',
            layout: {},
            paint: {
              'fill-color': '#000',
              'fill-opacity': 0.8
            }
          });
        });
      })
      .catch(error => {
        console.error('Error al obtener el GeoJSON:', error);
      });
  } */


  // Método para añadir la capa GeoJSON desde GeoServer con colores basados en "tipo"
  addGeoJSONLayer(map: mapboxgl.Map) {
    const geoJSONUrl = `https://geo.gob.bo/geoserver/geonode/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geonode%3Aamenazas_naturales&maxFeatures=50&outputFormat=application%2Fjson`;

    fetch(geoJSONUrl)
      .then(response => response.json())
      .then(data => {
          map.on('load', () => {
              // Añadir la fuente GeoJSON al mapa
              map.addSource('geoserver-geojson-layer', {
                  type: 'geojson',
                  data: data
              });

              // Añadir la capa GeoJSON con colores dinámicos según la propiedad "tipo"
              map.addLayer({
                  id: 'geoserver-geojson-layer',
                  type: 'fill',
                  source: 'geoserver-geojson-layer',
                  layout: {},
                  paint: {
                      'fill-color': [
                          'match',
                          ['get', 'tipo'],  // Propiedad del GeoJSON
                          'UR', '#FF5733',   // Urbano - Naranja fuerte
                          'RURAL', '#33FF57', // Rural - Verde
                          'MIXTO', '#3357FF', // Mixto - Azul
                          'PROTEGIDO', '#FFFF33', // Protegido - Amarillo
                          /* Default */ '#888888'
                      ],
                      'fill-opacity': 0.8,
                      'fill-outline-color': '#000000'
                  }
              });

              // Añadir bordes para mejorar la visibilidad de las zonas
              map.addLayer({
                  id: 'geoserver-geojson-borders',
                  type: 'line',
                  source: 'geoserver-geojson-layer',
                  layout: {},
                  paint: {
                      'line-color': '#000000',
                      'line-width': 1.5
                  }
              });
          });
      })
      .catch(error => {
          console.error('Error al obtener el GeoJSON:', error);
      });


}





  /* mapa!: mapboxgl.Map; // Variable para almacenar el mapa
  puntos: [number, number][] = []; // Almacena temporalmente los puntos del polígono actual
  poligonos: { id: string; coordenadas: [number, number][] }[] = []; // Almacena todos los polígonos seleccionados
  marcadores: mapboxgl.Marker[] = []; // Almacena los marcadores de los puntos
  poligonoEditando: string | null = null; // Almacena el ID del polígono que se está editando
  radioTolerancia: number = 10; // Radio de tolerancia para cerrar el polígono (en píxeles)

  // Definir los límites de Bolivia (aproximados)
  limitesBolivia = {
    norte: -9.68, // Latitud máxima (norte)
    sur: -22.9, // Latitud mínima (sur)
    este: -57.45, // Longitud máxima (este)
    oeste: -69.64, // Longitud mínima (oeste)
  };

  ngOnInit(): void {
    (mapboxgl as any).default.accessToken = environment.tokenMapbox;

    const bounds: mapboxgl.LngLatBoundsLike = [
      [-69.645, -22.898], // Suroeste de Bolivia
      [-57.453, -9.679], // Noreste de Bolivia
    ];

    this.mapa = new mapboxgl.Map({
      container: 'mapas',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-64.968, -16.29], // Centro aproximado de Bolivia
      zoom: 5, // Zoom óptimo para mostrar Bolivia entera
      maxBounds: bounds, // Limita la vista a Bolivia
    });

    // Esperar a que el estilo del mapa esté completamente cargado
    this.mapa.on('load', () => {
      // Ajustar el mapa automáticamente dentro de los límites
      this.mapa.fitBounds(bounds, { padding: 20 });

      // Deshabilitar el zoom y el desplazamiento fuera de Bolivia
      this.mapa.dragRotate.disable();
      this.mapa.keyboard.disable();
      this.mapa.touchZoomRotate.disable();

      // Activar el modo de dibujo
      this.activarModoDibujo();
    });
  } */
 /*  // Método para activar el modo de dibujo
  activarModoDibujo() {
    // Evento para capturar clics en el mapa y agregar puntos
    this.mapa.on('click', (e) => {
      if (this.puntos.length >= 3 && this.estaCercaDelPrimerPunto(e.point)) {
        // Cerrar el polígono si el usuario hace clic cerca del primer punto
        this.puntos.push(this.puntos[0]); // Cerrar el polígono
        this.dibujarPoligono(`polygon-temp`, this.puntos); // Dibujar el polígono temporalmente

        // Mostrar alerta para guardar el polígono
        const guardar = confirm('¿Desea guardar este polígono?');
        if (guardar) {
          this.guardarPoligono(); // Guardar el polígono en la lista
        } else {
          this.eliminarPoligonoTemporal(); // Eliminar el polígono temporal
        }
        this.puntos = []; // Reiniciar los puntos para permitir la selección de un nuevo polígono
      } else {
        this.agregarPunto(e.lngLat.lng, e.lngLat.lat); // Agregar punto seleccionado al array
      }
    });

    // Evento para eliminar el último punto al presionar la tecla "Escape"
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.eliminarUltimoPunto();
      }
    });
  }

  // Método para verificar si el punto está cerca del primer punto
  estaCercaDelPrimerPunto(puntoClick: mapboxgl.Point): boolean {
    if (this.puntos.length === 0) return false; // No hay puntos para comparar

    // Convertir el primer punto a coordenadas de pantalla (píxeles)
    const primerPunto = this.mapa.project([
      this.puntos[0][0],
      this.puntos[0][1],
    ]);

    // Calcular la distancia entre el punto clickeado y el primer punto
    const distancia = Math.sqrt(
      Math.pow(puntoClick.x - primerPunto.x, 2) +
        Math.pow(puntoClick.y - primerPunto.y, 2)
    );

    // Verificar si la distancia está dentro del radio de tolerancia
    return distancia <= this.radioTolerancia;
  }

  // Método para agregar un punto seleccionado en el mapa
  agregarPunto(longitud: number, latitud: number) {
    // Verificar si el punto está dentro de los límites de Bolivia
    if (
      latitud < this.limitesBolivia.sur ||
      latitud > this.limitesBolivia.norte ||
      longitud < this.limitesBolivia.oeste ||
      longitud > this.limitesBolivia.este
    ) {
      alert('Solo puedes seleccionar puntos dentro de Bolivia.');
      return; // No agregar el punto si está fuera de Bolivia
    }

    this.puntos.push([longitud, latitud]); // Agregar las coordenadas al array

    // Crear y añadir un marcador en la posición seleccionada
    const marcador = new mapboxgl.Marker({ draggable: true })
      .setLngLat([longitud, latitud])
      .addTo(this.mapa);

    // Evento para actualizar las coordenadas del punto al mover el marcador
    marcador.on('dragend', () => {
      const nuevaPosicion = marcador.getLngLat();

      // Validar nuevamente si el marcador se mueve fuera de Bolivia
      if (
        nuevaPosicion.lat < this.limitesBolivia.sur ||
        nuevaPosicion.lat > this.limitesBolivia.norte ||
        nuevaPosicion.lng < this.limitesBolivia.oeste ||
        nuevaPosicion.lng > this.limitesBolivia.este
      ) {
        alert('No puedes mover el marcador fuera de Bolivia.');
        marcador.setLngLat([longitud, latitud]); // Revertir a la posición original
        return;
      }

      const puntoIndex = this.marcadores.indexOf(marcador);
      this.puntos[puntoIndex] = [nuevaPosicion.lng, nuevaPosicion.lat];
      this.dibujarLineaTemporal([...this.puntos]);
    });

    this.marcadores.push(marcador); // Guardar el marcador en el array

    // Dibujar la línea temporal si hay más de un punto
    if (this.puntos.length > 1) {
      this.dibujarLineaTemporal([...this.puntos]);
    }
  }

  // Método para eliminar el último punto
  eliminarUltimoPunto() {
    if (this.puntos.length > 0) {
      this.puntos.pop();
      const ultimoMarcador = this.marcadores.pop();
      if (ultimoMarcador) {
        ultimoMarcador.remove();
      }

      // Actualizar línea temporal
      if (this.puntos.length > 1) {
        this.dibujarLineaTemporal([...this.puntos]);
      } else {
        this.eliminarLineaTemporal();
      }
    }
  }

  // Método para guardar el polígono en la lista y dibujarlo en el mapa
  guardarPoligono() {
    const idPoligono = `polygon-${this.poligonos.length + 1}`; // Crear un ID único

    // Guardar el polígono en la lista
    this.poligonos.push({ id: idPoligono, coordenadas: [...this.puntos] });

    // Dibujar el polígono en el mapa
    this.dibujarPoligono(idPoligono, [...this.puntos]);

    // Eliminar el polígono temporal
    this.eliminarPoligonoTemporal();

    // Limpiar los marcadores
    this.marcadores.forEach((marcador) => marcador.remove());
    this.marcadores = [];
  }

  // Método para dibujar un polígono en el mapa
  dibujarPoligono(id: string, coordenadas: [number, number][]) {
    const color = this.generarColorAleatorio(); // Generar un color aleatorio para el polígono

    // Verificar si la fuente ya existe y eliminarla si es necesario
    if (this.mapa.getSource(id)) {
      this.mapa.removeLayer(id); // Eliminar la capa asociada
      this.mapa.removeSource(id); // Eliminar la fuente
    }

    // Agregar la fuente del polígono
    this.mapa.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coordenadas], // Se pasan las coordenadas del polígono
        },
      },
    });

    // Agregar la capa del polígono con un color diferente
    this.mapa.addLayer({
      id,
      type: 'fill',
      source: id,
      layout: {},
      paint: {
        'fill-color': color, // Color aleatorio
        'fill-opacity': 0.5, // Opacidad del polígono (50%)
      },
    });
  }

  // Método para eliminar el polígono temporal
  eliminarPoligonoTemporal() {
    const idPoligonoTemporal = 'polygon-temp';

    // Eliminar el polígono temporal si existe
    if (this.mapa.getSource(idPoligonoTemporal)) {
      this.mapa.removeLayer(idPoligonoTemporal);
      this.mapa.removeSource(idPoligonoTemporal);
    }
  }

  // Método para dibujar una línea temporal mientras el usuario selecciona puntos
  dibujarLineaTemporal(coordenadas: [number, number][]) {
    const idLineaTemporal = 'linea-temporal';

    // Verificar si la fuente ya existe y eliminarla si es necesario
    if (this.mapa.getSource(idLineaTemporal)) {
      this.mapa.removeLayer(idLineaTemporal);
      this.mapa.removeSource(idLineaTemporal);
    }

    // Agregar la fuente de la línea temporal
    this.mapa.addSource(idLineaTemporal, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordenadas,
        },
      },
    });

    // Agregar la capa de la línea temporal
    this.mapa.addLayer({
      id: idLineaTemporal,
      type: 'line',
      source: idLineaTemporal,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#FF0000', // Color rojo para la línea temporal
        'line-width': 2,
      },
    });
  }

  // Método para eliminar la línea temporal
  eliminarLineaTemporal() {
    const idLineaTemporal = 'linea-temporal';

    // Eliminar la línea temporal si existe
    if (this.mapa.getSource(idLineaTemporal)) {
      this.mapa.removeLayer(idLineaTemporal);
      this.mapa.removeSource(idLineaTemporal);
    }
  }

  // Método para generar un color aleatorio en formato hexadecimal
  generarColorAleatorio(): string {
    const letras = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letras[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Método para mostrar todos los polígonos seleccionados
  mostrarPoligonosSeleccionados() {
    console.log('Polígonos seleccionados:', this.poligonos);
    alert(`Total de polígonos seleccionados: ${this.poligonos.length}`);
  }

  // Método para eliminar un polígono guardado
  eliminarPoligono(id: string) {
    const poligonoIndex = this.poligonos.findIndex((p) => p.id === id);
    if (poligonoIndex !== -1) {
      // Eliminar el polígono de la lista
      this.poligonos.splice(poligonoIndex, 1);

      // Eliminar el polígono del mapa
      if (this.mapa.getSource(id)) {
        this.mapa.removeLayer(id);
        this.mapa.removeSource(id);
      }
    }
  }

  // Método para editar un polígono existente
  editarPoligono(id: string) {
    const poligono = this.poligonos.find((p) => p.id === id);
    if (poligono) {
      // Limpiar puntos y marcadores anteriores
      this.puntos = [];
      this.marcadores.forEach((marcador) => marcador.remove());
      this.marcadores = [];

      // Cargar los puntos del polígono
      this.poligonoEditando = id;
      this.puntos = [...poligono.coordenadas];
      this.dibujarPuntosDelPoligono(this.puntos);
      this.dibujarPoligono(`polygon-temp`, this.puntos);

      // Hacer los marcadores editables
      this.marcadores.forEach((marcador) => {
        marcador.setDraggable(true);
        marcador.on('dragend', () => {
          const nuevaPosicion = marcador.getLngLat();
          const puntoIndex = this.marcadores.indexOf(marcador);
          this.puntos[puntoIndex] = [nuevaPosicion.lng, nuevaPosicion.lat];
          this.dibujarPoligono(`polygon-temp`, this.puntos);
        });
      });
    }
  }

  // Método para guardar los cambios después de editar
  guardarCambios() {
    if (this.poligonoEditando) {
      // Buscar el polígono en edición
      const poligonoIndex = this.poligonos.findIndex(
        (p) => p.id === this.poligonoEditando
      );

      if (poligonoIndex !== -1) {
        // Actualizar las coordenadas del polígono
        this.poligonos[poligonoIndex].coordenadas = [...this.puntos];

        // Actualizar el polígono en el mapa
        this.dibujarPoligono(this.poligonoEditando, this.puntos);

        // Limpiar el estado de edición
        this.eliminarPoligonoTemporal();
        this.poligonoEditando = null;
        this.puntos = [];
        this.marcadores.forEach((marcador) => marcador.remove());
        this.marcadores = [];

        console.log('Cambios guardados:', this.poligonos[poligonoIndex]);
      }
    }
  }

  // Método para dibujar los puntos del polígono en el mapa
  dibujarPuntosDelPoligono(puntos: [number, number][]) {
    // Eliminar marcadores anteriores si existen
    this.marcadores.forEach((marcador) => marcador.remove());
    this.marcadores = []; // Reiniciar el array de marcadores

    // Dibujar los nuevos puntos
    puntos.forEach((punto) => {
      const marcador = new mapboxgl.Marker({ draggable: true })
        .setLngLat(punto)
        .addTo(this.mapa);
      this.marcadores.push(marcador); // Guardar el marcador en el array
    });
  } */

}
