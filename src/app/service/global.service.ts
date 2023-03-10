import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AppConfigService } from '../appconfig.service';

@Injectable({ providedIn: 'root' })
export class GlobalService {
  public currentService = new FormControl();
  constructor(public configService: AppConfigService) {
    // set default service to the form
    this.currentService.patchValue(this.configService.config.defaultService);
  }
}
