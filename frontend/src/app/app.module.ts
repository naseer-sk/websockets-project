import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NewPageComponent } from './new-page/new-page.component';
import { RouterModule, Routes } from '@angular/router';
import { MessageCardComponent } from './message-card/message-card.component';
import { UnreadPopupComponent } from './unread-popup/unread-popup.component';
import { WebsocketService } from './websocket.service';
import { CreateNotificationComponent } from './create-notification/create-notification.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';

const routes:Routes=[
  {path:'',component:NavBarComponent},
  {path:'newPage',component:NewPageComponent},
  {path:'create',component:CreateNotificationComponent},
  {path:'navPage',component:NavBarComponent}
]

@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    NewPageComponent,
    MessageCardComponent,
    UnreadPopupComponent,
    CreateNotificationComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot(routes),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    WebsocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
