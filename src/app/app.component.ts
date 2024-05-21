import { Component, OnInit } from '@angular/core';
import { AppConfigService } from './appconfig.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  appName = '';
  constructor(
    public configService: AppConfigService,
  ) {}
  
  ngOnInit(): void {
    this.appName = this.configService.config.appName;
  }
}
