import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, filter } from 'rxjs';
import { AppConfigService } from './appconfig.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    public api: HttpClient,
    private _configService: AppConfigService
  ) {
    this.getProcedures(this._configService.config.defaultService).subscribe();
    this.getObservedProps(
      this._configService.config.defaultService
    ).subscribe();
    this.getServices().subscribe();
  }
  public procedures: BehaviorSubject<any> = new BehaviorSubject(null);
  public unfilteredProcedures: Array<any> = [];
  public services: BehaviorSubject<any> = new BehaviorSubject(null);
  public observedProperties: BehaviorSubject<any> = new BehaviorSubject(null);

  getProcedures(service): Observable<any> {
    return this.api
      .get<any>(
        `${this._configService.config.apiBaseUrl}/wa/istsos/services/${service}/procedures/operations/geojson`
      )
      .pipe(
        map((procedures) => {
          this.unfilteredProcedures = procedures.features;
          this.procedures.next(procedures.features);
        })
      );
  }
  getServices(): Observable<any> {
    return this.api
      .get<any>(
        `${this._configService.config.apiBaseUrl}/wa/istsos/services?start=0&limit=25`
      )
      .pipe(
        map((response) => {
          this.services.next(response.data.map((s) => s.service));
        })
      );
  }
  getObservedProps(service): Observable<any> {
    return this.api
      .get<any>(
        `${this._configService.config.apiBaseUrl}/wa/istsos/services/${service}/observedproperties`
      )
      .pipe(
        map((response) => {
          this.observedProperties.next(
            response.data.filter((obsProp) => {
              return obsProp.procedures.length > 0;
            })
          );
        })
      );
  }
}
