import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AppConfigService } from '../appconfig.service';

@Injectable({ providedIn: 'root' })
export class ProcedureService {
  public noDataValueForm = new FormControl();
  constructor(public config: AppConfigService) {
    this.noDataValueForm.patchValue(this.config.config.NO_DATA_VALUE);
  }
}
