import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpHeaders,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './appconfig.service';

@Injectable({ providedIn: 'root' })
export class AuthentInterceptor implements HttpInterceptor {
  constructor(public configService: AppConfigService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log('LAAA', request);
    if (!request.url.includes('config.json')) {
      request = request.clone({
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Host: 'istsos.ecrins.net',
          Authorization:
            'Basic ' + window.btoa(this.configService.config.HTTP_API_AUTHENT),
        }),
      });
    }

    return next.handle(request);
  }
}
