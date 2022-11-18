import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { GeoJSON } from 'leaflet';
import { filter, lastValueFrom } from 'rxjs';
import { AppConfigService } from '../appconfig.service';
import { MapService } from '../map/map.service';
import { FormControl } from '@angular/forms';

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
  public currentService = new FormControl();
  public observedProperties = new FormControl();
  public geojsonLayer: GeoJSON;
  ngAfterViewInit(): void {
    this.currentService.patchValue(this.configService.config.defaultService);
    this.currentService.valueChanges.subscribe((service) => {
      this.data.getProcedures(service).subscribe();
    });
    this.observedProperties.valueChanges.subscribe((prop) => {
      if (prop == null) {
        this.data.procedures.next(this.data.unfilteredProcedures);
        return;
      }
      const procedureWithCurrentObsProp: Array<string> = prop.procedures;

      const filteredProcedures = this.data.unfilteredProcedures.filter(
        (procedure) => {
          return procedureWithCurrentObsProp.includes(
            procedure.properties.name
          );
        }
      );
      this.data.procedures.next(filteredProcedures);
    });
    this.data.procedures
      .pipe(filter((procedure) => procedure != null))
      .subscribe((procedures) => {
        if (this.geojsonLayer) {
          this.mapService.map.removeLayer(this.geojsonLayer);
        }
        this.geojsonLayer = L.geoJSON(procedures, {
          onEachFeature: this.onEachFeature.bind(this),
        });
        this.geojsonLayer.addTo(this.mapService.map);
        // HACK ? otherwise the map is zoom at earth level...
        setTimeout(() => {
          const currentBounds = this.geojsonLayer.getBounds();
          if (currentBounds._northEast) {
            this.mapService.map.fitBounds(currentBounds);
          }
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

  refreshFilters() {
    this.observedProperties.patchValue(null);
  }
}
