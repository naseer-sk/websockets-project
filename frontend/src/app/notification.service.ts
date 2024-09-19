import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Inotify } from './new-page/new-page.component';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private url = 'http://127.0.0.1:5000/';
  private allUrl = 'http://127.0.0.1:5000/all';
  private postUrl = 'http://127.0.0.1:5000/insert_notification';
  private deleteUrl='http://127.0.0.1:5000/delete_notifications';

  private notificationSource = new BehaviorSubject<Inotify[]>([]);
  currentNotifications = this.notificationSource.asObservable();
  websocketService: any;

  constructor(private http: HttpClient) { }

  public getData(): Observable<Inotify[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.get<Inotify[]>(this.url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  public sendNotifications(notifications: Inotify[]): void {
    this.notificationSource.next(notifications);
  }

  public getAll(): Observable<Inotify[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.get<Inotify[]>(this.allUrl, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  public addNotification(notification: Inotify): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.postUrl, notification, { headers });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.error.message || error.message);

    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }

  public deleteData(payload:any):Observable<any>
  {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
   return this.http.post(this.deleteUrl,payload)
  }

  updateNotifications(notifications: Inotify[]) {
    this.notificationSource.next(notifications);
  }
}

