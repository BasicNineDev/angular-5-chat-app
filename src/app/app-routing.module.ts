import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './components/main/main.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuardService } from './services/auth-guard.service';
import { RegisterComponent } from './components/register/register.component';
import { ViewServerComponent } from './components/view-server/view-server.component';
import { HomeComponent } from './components/home/home.component';
import { ServerResolver } from './services/server-resolver.service';
import { MainResolver } from './services/main-resolver.service';
import { ChatChannelComponent } from './components/chat-channel/chat-channel.component';
import { ChatChannelResolver } from './services/chat-channel-resolver.service';

export const appRoutes: Routes = [
  {
    path: '', redirectTo: '/channels', pathMatch: 'full'
  },
  {
    path: 'channels', component: MainComponent,
    canActivate: [AuthGuardService],
    resolve: { state: MainResolver },
    children: [
      {
        path: ':id', component: ViewServerComponent,
        resolve: { state: ServerResolver },
        children: [
          {
            path: ':id', component: ChatChannelComponent,
            resolve: { state: ChatChannelResolver },
          }
        ]
      },
      {
        path: '', component: HomeComponent
      },
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, { enableTracing: false }),
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
