import { Component, OnInit, ViewChild } from '@angular/core';
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
export class MaplistComponent implements OnInit {
  constructor(
    public data: DataService,
    public configService: AppConfigService,
    public mapService: MapService
  ) {}
  public config = this.configService.config;
  public layerDict: any;
  ngOnInit(): void {
    this.data.procedures
      .pipe(filter((procedure) => procedure != null))
      .subscribe((procedures) => {
        const geojsonLayer = L.geoJSON(procedures, {
          onEachFeature: this.onEachFeature.bind(this),
        });
        this.mapService.map.subscribe((map) => {
          geojsonLayer.addTo(map);
          // HACK ? dont understand why ?
          setTimeout(() => {
            map.fitBounds(geojsonLayer.getBounds());
          }, 500);
        });
      });
  }

  onEachFeature(feature, layer) {
    // this.layerDict[feature.id] = layer;
    // console.log(feature);
    // layer.on({
    //   click: (e) => {
    //     layer.openPopup('YES');
    //   },
    // });
  }
}
