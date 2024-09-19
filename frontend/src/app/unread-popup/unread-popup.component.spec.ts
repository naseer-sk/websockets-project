import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnreadPopupComponent } from './unread-popup.component';

describe('UnreadPopupComponent', () => {
  let component: UnreadPopupComponent;
  let fixture: ComponentFixture<UnreadPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnreadPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnreadPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
