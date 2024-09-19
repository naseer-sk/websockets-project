import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Inotify } from '../new-page/new-page.component';
import { NotificationService } from '../notification.service';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  unreadNotifications: Inotify[] = [];
  notifications: Inotify[] = [];
  unreadNotificationsFive:Inotify[]=[];
  
  show_pop_up = false;
  show_page = false;

  constructor(private router: Router, private notify: NotificationService, private sharedService: SharedService) {}

  ngOnInit() {
    this.notify.getAll().subscribe(results => {
      this.notifications = results;
      this.loadUnreadNotifications();
    });

    // Re-fetch notifications on every navigation to update the header
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.fetchNotifications(); // Re-fetch or update notifications on navigation
    });

    // Subscribe to selectedIds$ to update read notifications
    this.sharedService.selectedIds$.subscribe(selectedIds => {
      if (selectedIds && selectedIds.length > 0) {
        this.updateReadStatus(selectedIds);
      }
    });
  }

  onClick() {
    this.show_pop_up = !this.show_pop_up;
    this.unreadNotificationsFive=this.unreadNotifications.slice(0, 5);
  }

  moveToNav()
  {
    this.router.navigate(['/navPage'])
  }

  private fetchNotifications() {
    this.notify.getAll().subscribe(results => {
      this.notifications = results.map(notification => ({
        ...notification,
        isread: notification.isread || false
      }));
      this.loadUnreadNotifications();
    });
  }

  private loadUnreadNotifications() {
    this.unreadNotifications = this.notifications.filter(notification => !notification.isread);
  }

  private updateReadStatus(selectedIds: number[]) {
    setTimeout(() => {
      this.notifications = this.notifications.map(notification => 
        selectedIds.includes(notification.id)
          ? { ...notification, isread: true }
          : notification
      );
      this.loadUnreadNotifications();
    }, 0);
  }

  showPage() {
    this.unreadNotifications = this.unreadNotifications.map(notification => ({
      ...notification,
      isread: true
    }));
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
}
