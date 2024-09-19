import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Inotify } from '../new-page/new-page.component';
import { NotificationService } from '../notification.service';
import { WebsocketService } from 'app/websocket.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent implements OnInit {
  notifications: Inotify[] = [];
  unreadNotifications: Inotify[] = [];
  show_pop_up = false;
  show_page = false;

  constructor(private router: Router, private notify: NotificationService, private websocketService: WebsocketService) {}

  ngOnInit() {
    this.notify.getData().subscribe((results) => {
      this.notifications = results.map(notification => ({
        ...notification,
        isread: false
      }
    ));


      this.notify.sendNotifications(this.notifications);
    });

    
    // this.websocketService.getNotifications().subscribe((data: Inotify) => {
    //   const newNotification = {
    //     ...data,
    //     isread: false  
    //   };
    //   this.notifications.push(newNotification);
    //   console.log('Received message:', newNotification);
    //   this.notify.sendNotifications(this.notifications);
    // });
  }

  onClick() {
    this.show_pop_up = !this.show_pop_up;
  }

  showPage() {
    this.unreadNotifications = this.unreadNotifications.map(notification => ({
      ...notification,
      isread: true 
    }));
    this.notifications = this.notifications.map(notification =>
      this.unreadNotifications.find(unread => unread.id === notification.id)
        ? { ...notification, isread: true }
        : notification
    );

    this.show_page = true;
    this.show_pop_up = false;
    this.router.navigate(['/newPage']);
  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest('.popup') && !targetElement.closest('.fa-bell')) {
      this.show_pop_up = false;
    }
  }

  createNotify() {
    this.router.navigate(['/create']);
  }
}
