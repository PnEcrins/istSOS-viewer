import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcedureComponent } from './procedure/procedure.component';
import { MaplistComponent } from './maplist/maplist.component';
const routes: Routes = [
  {
    path: 'service/:service/procedure/:procedure',
    component: ProcedureComponent,
  },
  { path: '', component: MaplistComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
