import { Component, Input } from '@angular/core';
import { Inotify } from '../new-page/new-page.component';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from 'app/notification.service';
import { SharedService } from 'app/shared.service';

@Component({
  selector: 'app-message-card',
  templateUrl: './message-card.component.html',
  styleUrl: './message-card.component.css'
})
export class MessageCardComponent {
  @Input() notification!: Inotify; 
  buttonDisabled=false;
  idList=[]

  constructor(private http:HttpClient,private notify:NotificationService,private sharedservice:SharedService){}

  deleteData()
  {
  
  

  if (this.notification && this.notification.id) {
    this.sharedservice.setDeletedNotification(this.notification.id);
    this.idList = [];
  } else {
    console.error('Notification ID is not available.');
  }


  }

  markAsRead()
  {
    // this.buttonDisabled=true;
    this.notification.isread=true
  }

}
