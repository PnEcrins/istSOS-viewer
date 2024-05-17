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
  public observedPropertiesValues: any =  {};
  public traces: any;

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
              next: (result) => {
                this.plotAndStoreData(result);
              },
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
      this.plotAndStoreData(data);
    });
  }

  plotAndStoreData(result) {
    this.data = result;
    this.traces = [];
    this.observedPropertiesValues = {};
    let indexOfValue = 1;

    this.plotForm.value.observedProperties?.forEach((prop) => {
      this.traces.push({
        x: [],
        // we push NaN for all "NaN" or value = noDataValueForm and value not in range minExcludedValueForm and maxExcludedValueForm
        y: [],
        // use for export to export the raw data not the data replaced with NaN
        yNotFiltered: [],
        mode: (prop as any).plotType,
        indexOfValue: indexOfValue,
        name: (prop as any).observedProperty.name,
      });
      // the value list is set like this [value, qualityindex, value, qualityIndex ...]
      indexOfValue = indexOfValue + 2;
    });

    // if no data config is not NaN, we must eliminate this value from the graph
    const noDataValue = parseFloat(
      this.procedureService.noDataValueForm.value
    );
      result.data[0].result.DataArray.values.forEach((values: Array<any>) => {
        this.traces.forEach((trace) => {
          let yValue = values[trace.indexOfValue];
          if(
            yValue == noDataValue || yValue == 'NaN' ||
             (this.procedureService.minExcludedValueForm.value && yValue <= this.procedureService.minExcludedValueForm.value) ||
             (this.procedureService.maxExcludedValueForm.value && yValue >= this.procedureService.maxExcludedValueForm.value)
            ) {
              trace.x.push(values[0]);
              trace.y.push(NaN);
              trace.yNotFiltered.push(yValue);
            }
          else {
            trace.x.push(values[0]);
            trace.y.push(values[trace.indexOfValue]);
            trace.yNotFiltered.push(yValue);
          }
        });
      });

      
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
      Plotly.newPlot(graphEl as any, this.traces, layout);
      
  }

  addNewPropertyForm() {
    const formGroup = new FormGroup({
      observedProperty: new FormControl(),
      plotType: new FormControl('lines'),
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

  generateCSV() {
    // set header
    let fileStr = "date;"
    let observedProp = this.plotForm.value.observedProperties?.map((prop:any) => prop.observedProperty.name);
    if(observedProp) {
      fileStr += observedProp.join(";")
    }
    fileStr += "\r\n"
    
    // Loop on all data of the first trace (all traces have the same length)
    for(let i = 0; i < this.traces[0].x.length; i++) {
      // Set date      
      fileStr += this.traces[0].x[i] + ";";
      this.traces.forEach((trace:any) => {
        // set properties for each plot trace
        let val = trace.yNotFiltered[i];
        if(!val) {
          val = "NaN"
        }
        fileStr += val + ";"
      })
      fileStr +=  "\r\n"
    }
    let res = "Text to save in a text file";
    const blob = new Blob([(fileStr as string)], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  }
}

@Component({
  selector: 'dialog-plot-config',
  templateUrl: 'dialog-plot-config.html',
})
export class DialogPlotConfig {
  constructor(public procedureService: ProcedureService) {}
}
