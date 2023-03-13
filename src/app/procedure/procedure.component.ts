import {
  AfterViewInit,
  Component,
  OnInit,
  ResolvedReflectiveFactory,
} from '@angular/core';
import * as Plotly from 'plotly.js-dist-min';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { FormGroup, FormControl, FormArray, Form } from '@angular/forms';
import { AppConfigService } from '../appconfig.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { MapService } from '../map/map.service';
import { ProcedureService } from './procedure.service';

@Component({
  selector: 'app-procedure',
  templateUrl: './procedure.component.html',
  styleUrls: ['./procedure.component.css'],
  providers: [MapService],
})
export class ProcedureComponent implements AfterViewInit {
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public configService: AppConfigService,
    private _snackBar: MatSnackBar,
    private _mapService: MapService,
    public dialog: MatDialog,
    public procedureService: ProcedureService
  ) {}
  public config = this.configService.config;
  public data: Array<any> | null;
  public procedure;
  public procedureName: string | null;
  public serviceName: string | null;
  public startPosition: Date | null = null;
  public endPosition: Date | null = null;
  public observedProperties: Array<any>;
  public noDataOnProcedure = false;
  public offering: string;
  public plotForm = new FormGroup({
    startDate: new FormControl(),
    endDate: new FormControl(),
    observedProperties: new FormArray([]),
  });

  ngAfterViewInit(): void {
    this.addNewPropertyForm();
    this.route.paramMap.subscribe((routeParam) => {
      this.procedureName = routeParam.get('procedure');
      this.serviceName = routeParam.get('service');
      this.http
        .get<any>(
          `${this.configService.config.apiBaseUrl}/wa/istsos/services/${this.serviceName}/procedures/operations/geojson?epsg=4326&procedure=${this.procedureName}`
        )
        .subscribe((proc) => {
          if (proc.features.length == 0) {
            this._snackBar.open(
              'API error - this procedure has no description',
              'Close'
            );
            this.noDataOnProcedure = true;
            throw new Error('IstSOS API error : missing procedure');
          }

          this.procedure = proc.features[0];

          this.observedProperties =
            this.procedure.properties.observedproperties;
          const geojsonLayer = L.geoJSON(this.procedure);
          geojsonLayer.addTo(this._mapService.map);
          this._mapService.map.fitBounds(geojsonLayer.getBounds());
          // default show the last year of the first observed property

          if (
            this.procedure.properties.samplingTime.endposition &&
            this.procedure.properties.samplingTime.beginposition &&
            this.procedure.properties.offerings.length > 0
          ) {
            this.offering = this.procedure.properties.offerings[0];
            this.endPosition = new Date(
              this.procedure.properties.samplingTime.endposition
            );

            this.startPosition = new Date(this.endPosition.getTime());
            this.startPosition.setFullYear(this.endPosition.getFullYear() - 1);

            this.plotForm.patchValue({
              startDate: this.startPosition,
              endDate: this.endPosition,
            });

            (this.plotForm.get('observedProperties') as FormArray).patchValue([
              {
                plotType: 'lines',
                observedProperty:
                  this.procedure.properties.observedproperties[0],
              },
            ]);
            this.getData(this.startPosition, this.endPosition).subscribe({
              next: (result) => this.plotData(result),
              error: (e) => console.log('ERROR', e.message),
            });
          } else {
            if (this.procedure.properties.offerings.length == 0) {
              this._snackBar.open(
                'This procedure is not member of any offering. Please attach it to a offering in the backoffice',
                'Close'
              );
            }
            this.noDataOnProcedure = true;
          }
        });
    });
  }

  onPlotData() {
    const formValues = this.plotForm.value;
    this.getData(formValues.startDate, formValues.endDate).subscribe((data) => {
      this.plotData(data);
    });
  }

  plotData(result) {
    this.data = result;
    const x: any[] = [];
    const y: any[] = [];
    const traces: any[] = [];
    let indexOfValue = 1;

    this.plotForm.value.observedProperties?.forEach((prop) => {
      traces.push({
        x: [],
        y: [],
        mode: (prop as any).plotType,
        indexOfValue: indexOfValue,
        name: (prop as any).observedProperty.name,
      });
      // the value list is set like this [value, qualityindex, value, qualityIndex ...]
      indexOfValue = indexOfValue + 2;
    });

    // if no data config is not NaN, we must eliminate this value from the graph
    if (this.procedureService.noDataValueForm.value == 'NaN') {
      result.data[0].result.DataArray.values.forEach((values: Array<any>) => {
        traces.forEach((trace) => {
          trace.x.push(values[0]);
          trace.y.push(values[trace.indexOfValue]);
        });
      });
    } else {
      const noDataValue = parseFloat(
        this.procedureService.noDataValueForm.value
      );
      result.data[0].result.DataArray.values.forEach((values: Array<any>) => {
        traces.forEach((trace) => {
          if (values[trace.indexOfValue] != noDataValue) {
            trace.x.push(values[0]);
            trace.y.push(values[trace.indexOfValue]);
          } else {
            trace.x.push(values[0]);
            trace.y.push(NaN);
          }
        });
      });
    }
    const graphEl = document.getElementById('plotly');
    const layout = {
      margin: { t: 0 },
      xaxis: {
        hoverformat: '%Y-%m-%dT%H:%S',
        rangeslider: {
          bordercolor: '#000',
          bgcolor: '#d9d9d930',
          borderwidth: 1,
        },
      },
    };
    Plotly.newPlot(graphEl as any, traces, layout);
  }

  addNewPropertyForm() {
    const formGroup = new FormGroup({
      observedProperty: new FormControl(),
      plotType: new FormControl(),
    });
    (this.plotForm.get('observedProperties') as FormArray).push(formGroup);
  }

  removePropertyForm(index) {
    (this.plotForm.get('observedProperties') as FormArray).removeAt(index);
  }

  getData(startDate, endDate): Observable<any> {
    this.data = null;
    const formValues = (this.plotForm.get('observedProperties') as FormArray)
      .value;
    const observedProperties = formValues
      .map((f) => f.observedProperty.def)
      .join(',');

    const chartSamplingTimeSerie = `${startDate.toISOString()}/${endDate.toISOString()}`;
    const url = `${this.configService.config.apiBaseUrl}/wa/istsos/services/${this.serviceName}/operations/getobservation/offerings/${this.offering}/procedures/${this.procedureName}/observedproperties/${observedProperties}/eventtime/${chartSamplingTimeSerie}`;

    return (
      this.http
        .get(url, { responseType: 'text' })
        // if Nan value in the result its not a valid JSON
        // must eva it
        .pipe(map((result) => JSON.parse(result.replace(/\bNaN\b/g, 'null'))))
    );
  }

  openDialog() {
    this.dialog.open(DialogPlotConfig);
  }
}

@Component({
  selector: 'dialog-plot-config',
  templateUrl: 'dialog-plot-config.html',
})
export class DialogPlotConfig {
  constructor(public procedureService: ProcedureService) {}
}
