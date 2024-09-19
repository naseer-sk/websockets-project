import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private messagesSubject = new Subject<any>();
  private apiUrl = 'http://localhost:5000/api';
  private isConnected = false; //tracks websocket connection

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initWebSocket();
  }

  private initWebSocket() {
    if (isPlatformBrowser(this.platformId) && !this.isConnected) {
        this.socket$ = webSocket('ws://localhost:5000/ws');
        this.socket$.subscribe(
            (message) => {
                console.log('Message received:', message); // Log received messages
                this.messagesSubject.next(message);
            },
            (error) => {
                console.error('WebSocket error:', error);
            },
            () => {
                console.log('WebSocket connection closed');
                console.log('Hi');
                this.isConnected = false;
                // Attempt to reconnect after a delay
                setTimeout(() => this.initWebSocket(), 5000);
            }
        );
        this.isConnected = true;
        console.log('WebSocket connection established'); // Confirm connection
    }
}


  public getNotifications(): Observable<any> {
    return this.messagesSubject.asObservable().pipe(
      shareReplay(1)
    );
  }

  public sendMessage(message: any): void {
    if (this.socket$ && this.isConnected) {
      this.socket$.next(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  }

  public fetchLatestNotifications(limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications?limit=${limit}`).pipe(
      tap(data => console.log('Fetched latest notifications:', data)),
      catchError(this.handleError('fetchLatestNotifications', []))
    );
  }

  public fetchAllNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications/all`).pipe(
      tap(data => console.log('Fetched all notifications:', data)),
      catchError(this.handleError('fetchAllNotifications', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  public close(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.isConnected = false;
    }
  }
}