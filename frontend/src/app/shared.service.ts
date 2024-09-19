import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Inotify } from './new-page/new-page.component';  // Adjust the path as per your project structure

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private deletedNotificationSubject = new BehaviorSubject<number>(0);
  deletedNotification$ = this.deletedNotificationSubject.asObservable();

  private selectedIdsSubject = new BehaviorSubject<number[]>([]);
  selectedIds$ = this.selectedIdsSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<Inotify[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor() { }

  setDeletedNotification(id: number) {
    this.deletedNotificationSubject.next(id);
  }

  updateSelectedIds(ids: number[]) {
    this.selectedIdsSubject.next(ids);
  }

  updateNotifications(notifications: Inotify[]) {
    this.notificationsSubject.next(notifications);
  }

  getNotifications(): Inotify[] {
    return this.notificationsSubject.getValue();
  }
}
