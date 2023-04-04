import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { GeoJSON } from 'leaflet';
import { filter, Subscription } from 'rxjs';
import { AppConfigService } from '../appconfig.service';
import { MapService } from '../map/map.service';
import { GlobalService } from '../service/global.service';

@Component({
  selector: 'app-maplist',
  templateUrl: './maplist.component.html',
  styleUrls: ['./maplist.component.css'],
  providers: [MapService],
})
export class MaplistComponent implements AfterViewInit, OnDestroy {
  constructor(
    public data: DataService,
    public configService: AppConfigService,
    public mapService: MapService,
    public globalService: GlobalService
  ) {}
  public config = this.configService.config;
  public layerDict: any;
  public geojsonLayer: GeoJSON;
  public subs: Array<Subscription> = [];
  public markerClusterGroup = L.markerClusterGroup();
  ngAfterViewInit(): void {
    // event on service change
    const sub = this.globalService.currentService.valueChanges.subscribe(
      (service) => {
        this.data.getProcedures(service).subscribe();
        this.data.getObservedProps(service).subscribe();
      }
    );
    this.subs.push(sub);
    // event on observed prop change
    // frontend filter on procedures which has the current observed prop
    const sub2 = this.globalService.observedProperties.valueChanges.subscribe(
      (prop) => {
        if (prop == null) {
          this.data.procedures.next(this.data.unfilteredProcedures);
          return;
        }
        const procedureWithCurrentObsProp = prop.procedures;

        const filteredProcedures = this.data.unfilteredProcedures.filter(
          (procedure) => {
            return procedureWithCurrentObsProp.includes(
              procedure.properties.name
            );
          }
        );
        this.data.procedures.next(filteredProcedures);
      }
    );
    this.subs.push(sub2);
    // on procedure change change them on map
    this.data.procedures
      .pipe(filter((procedure) => procedure != null))
      .subscribe((procedures) => {
        console.log('change ?');

        if (this.geojsonLayer) {
          this.markerClusterGroup.removeLayer(this.geojsonLayer);
        }
        this.geojsonLayer = L.geoJSON(procedures, {
          onEachFeature: this.onEachFeature.bind(this),
        });
        this.markerClusterGroup.addLayers(this.geojsonLayer);
        this.mapService.map.addLayer(this.markerClusterGroup);
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
      <a href='./#/service/${this.globalService.currentService.value}/procedure/${feature.properties.name}'> See procedure detail </a>
    `);
  }

  zoomToFeature(proc) {
    const currentGeoJsonProc = L.geoJSON(proc);
    this.mapService.map.fitBounds(currentGeoJsonProc.getBounds());
  }

  refreshFilters() {
    this.globalService.observedProperties.patchValue(null);
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
