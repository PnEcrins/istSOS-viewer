import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { filter, lastValueFrom } from 'rxjs';
import { AppConfigService } from '../appconfig.service';
import { MapService } from '../map/map.service';

@Component({
  selector: 'app-maplist',
  templateUrl: './maplist.component.html',
  styleUrls: ['./maplist.component.css'],
  providers: [MapService],
})
export class MaplistComponent implements AfterViewInit {
  constructor(
    public data: DataService,
    public configService: AppConfigService,
    public mapService: MapService
  ) {}
  public config = this.configService.config;
  public layerDict: any;
  ngAfterViewInit(): void {
    this.data.procedures
      .pipe(filter((procedure) => procedure != null))
      .subscribe((procedures) => {
        const geojsonLayer = L.geoJSON(procedures, {
          onEachFeature: this.onEachFeature.bind(this),
        });
        geojsonLayer.addTo(this.mapService.map);
        // HACK ? otherwise the map is zoom at earth level...
        setTimeout(() => {
          this.mapService.map.fitBounds(geojsonLayer.getBounds());
        }, 500);
      });
  }

  onEachFeature(feature, layer) {
    layer.bindPopup(`
      ${feature.properties.name} <br>
      <a [routerLink]=['procedure', ${feature.properties.name}] href='./#/procedure/${feature.properties.name}'> See procedure detail </a>
    `);
  }

  zoomToFeature(proc) {
    const currentGeoJsonProc = L.geoJSON(proc);
    this.mapService.map.fitBounds(currentGeoJsonProc.getBounds());
  }
}
