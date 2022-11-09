import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AppConfigService } from './appconfig.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    public api: HttpClient,
    private _configService: AppConfigService
  ) {
    this.getProcedures().subscribe();
  }
  public procedures: BehaviorSubject<any> = new BehaviorSubject(null);

  getProcedures(): Observable<any> {
    return this.api
      .get<any>(
        `${this._configService.config.apiBaseUrl}/wa/istsos/services/ecrins/procedures/operations/geojson`
      )
      .pipe(
        map((procedures) => {
          this.procedures.next(procedures.features);
        })
      );
  }
}
