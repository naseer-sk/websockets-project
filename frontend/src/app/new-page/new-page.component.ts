import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../notification.service';
import { WebsocketService } from '../websocket.service';
import { SharedService } from '../shared.service';
import { Subscription } from 'rxjs';

export interface Inotify {
  id: number;
  dateTime: Date;
  message: string;
  status: string;
  isread: boolean;
  selected?: boolean;
}

@Component({
  selector: 'app-new-page',
  templateUrl: './new-page.component.html',
  styleUrls: ['./new-page.component.css']
})
export class NewPageComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  filteredNotifications: Inotify[] = [];
  notifications: Inotify[] = [];
  allNotifications: Inotify[] = [];
  showAll = false;

  private sharedServiceSubscription!: Subscription;
  private webSocketSubscription!: Subscription;

  constructor(
    private http: HttpClient,
    private notify: NotificationService,
    private webSocketService: WebsocketService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchNotifications();

    // Subscribe to WebSocket messages
    this.webSocketSubscription = this.webSocketService.getNotifications().subscribe(
      (data: Inotify[]) => {
        this.handleWebSocketMessage(data);
      },
      err => console.error('WebSocket error:', err),
      () => console.log('WebSocket complete')
    );

    // Subscribe to shared notifications for updates
    this.sharedServiceSubscription = this.sharedService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.filteredNotifications = this.notifications.filter(notification =>
        `${notification.message}`.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  ngOnDestroy() {
    if (this.sharedServiceSubscription) {
      this.sharedServiceSubscription.unsubscribe();
    }
    if (this.webSocketSubscription) {
      this.webSocketSubscription.unsubscribe();
    }
  }

  private fetchNotifications() {
    this.notify.getData().subscribe(results => {
      const notifications = results.map(notification => ({
        ...notification,
        isread: false
      }));
      this.notifications = notifications;
      this.filteredNotifications = [...notifications];
      this.sharedService.updateNotifications(notifications); // Update notifications in SharedService
      console.log("Fetched notifications:", this.notifications);
    }, error => console.error('Error fetching notifications', error));
  }

  private handleWebSocketMessage(data: Inotify[]) {
    console.log('Received WebSocket messages:', data);

    data.forEach((message: Inotify) => {
      const existingNotificationIndex = this.notifications.findIndex(notification => notification.id === message.id);
      if (existingNotificationIndex !== -1) {
        this.notifications[existingNotificationIndex] = {
          ...message,
          isread: false // Assuming all new notifications are unread
        };
      } else {
        this.notifications.push({
          ...message,
          isread: false 
        });
      }
    });
    this.notifications.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    this.filteredNotifications = [...this.notifications];
    this.sharedService.updateNotifications(this.notifications);

    console.log('Updated notifications:', this.notifications);
    this.cdr.detectChanges();
  }

  filterNotification() {
    this.filteredNotifications = this.notifications.filter(notification =>
      `${notification.message}`.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  viewAll() {
    this.notify.getAll().subscribe(results => {
      this.allNotifications = results;
      console.log('All Notifications:', this.allNotifications);
      this.showAll = true;
    });
  }

  onCheckboxChange() {
    this.cdr.detectChanges();
  }

  markSelectedAsRead() {
    const selectedIds = this.getSelectedNotificationIds();

    if (selectedIds.length > 0) {
      this.notifications.forEach(notification => {
        if (selectedIds.includes(notification.id)) {
          notification.isread = true; // Update the notification to read
          notification.selected = false; // Deselect it
        }
      });

      this.allNotifications.forEach(notification => {
        if (selectedIds.includes(notification.id)) {
          notification.isread = true; // Update the notification to read
          notification.selected = false; // Deselect it
        }
      });

      this.filteredNotifications = [...this.notifications];
      this.allNotifications = [...this.allNotifications];
      this.sharedService.updateNotifications(this.notifications);

      // Optionally update the shared service or send a backend request if needed
      this.sharedService.updateSelectedIds(selectedIds);
    }
  }

  deleteSelectedNotifications() {
    const selectedIds = this.getSelectedNotificationIds();

    if (selectedIds.length > 0) {
      const payload = selectedIds.map(id => ({ id: id.toString() }));
      this.notify.deleteData(payload).subscribe({
        next: () => {
          console.log('Selected notifications deleted');
          this.notifications = this.notifications.filter(notification => !selectedIds.includes(notification.id));
          this.filteredNotifications = [...this.notifications];
          this.allNotifications = [...this.notifications];
          this.sharedService.updateNotifications(this.notifications);
          this.sharedService.updateSelectedIds(selectedIds);
        },
        error: error => console.error('Error deleting notifications', error)
      });
    }
  }

  hasSelectedNotifications(): boolean {
    return this.getSelectedNotifications().length > 0;
  }

  selectAllNotifications() {
    const notificationsToSelect = this.showAll ? this.allNotifications : this.filteredNotifications;

    notificationsToSelect.forEach(notification => {
      notification.selected = true;
    });
    this.onCheckboxChange(); // Ensure any necessary updates are triggered
  }

  private getSelectedNotificationIds(): number[] {
    return (this.showAll ? this.allNotifications : this.filteredNotifications)
      .filter(notification => notification.selected)
      .map(notification => notification.id);
  }

  private getSelectedNotifications(): Inotify[] {
    return (this.showAll ? this.allNotifications : this.filteredNotifications)
      .filter(notification => notification.selected);
  }
}
