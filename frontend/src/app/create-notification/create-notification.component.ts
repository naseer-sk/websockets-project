import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Inotify } from 'app/new-page/new-page.component';
import { NotificationService } from 'app/notification.service';

@Component({
  selector: 'app-create-notification',
  templateUrl: './create-notification.component.html',
  styleUrls: ['./create-notification.component.css'] 
})
export class CreateNotificationComponent {

  notificationForm: FormGroup;
  showModal: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private notificationService: NotificationService) {
    this.notificationForm = this.fb.group({
      dateTime: ['', Validators.required],
      message: ['', Validators.required],
      status: ['success', Validators.required]
    });
  }

  onSubmit() {
    if (this.notificationForm.valid) {
        const notification = this.notificationForm.value as Inotify;
        console.log('Notification as JSON:', JSON.stringify(notification));
        this.notificationService.addNotification(notification).subscribe(
            response => {
                console.log('Notification added:', response);
                this.notificationService.getData().subscribe(notifications => {
                    this.notificationService.updateNotifications(notifications);
                });
                this.showModal = true;
                this.notificationForm.reset();
            },
            error => {
                console.error('Error adding notification:', error);
            }
        );
    }
  }

  OpenDashboard() {
    this.showModal = false;
    this.router.navigate(['/navPage']);
  }

  viewNotifications() {
    this.showModal = false;
    this.router.navigate(['/newPage']);
  }
}
