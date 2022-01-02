import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DocumentsListComponent} from "./documents-list/documents-list.component";
import {AuthGuard} from "./_helpers/auth.guard";
import {LoginComponent} from "./login/login.component";
import {ReviewComponent} from "./review/review.component";

const routes: Routes = [
  { path: '', component: DocumentsListComponent, canActivate: [AuthGuard]},
  { path: 'login', component: LoginComponent},
  { path: 'review/:documentId', component: ReviewComponent},
  { path: '**', redirectTo: ''},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
