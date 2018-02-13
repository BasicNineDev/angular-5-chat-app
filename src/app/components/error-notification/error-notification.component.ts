import { Component } from '@angular/core';
import { TransitionController, Transition, TransitionDirection } from 'ng2-semantic-ui';
import { ErrorService, ErrorNotification } from '../../services/error.service';

@Component({
  selector: 'app-error-notification',
  templateUrl: './error-notification.component.html',
  styleUrls: ['./error-notification.component.scss']
})
export class ErrorNotificationComponent {
  private transitionController = new TransitionController();
  public errorNotification: ErrorNotification;
  public transitionDuration = 1;

  constructor(errorService: ErrorService) {
    errorService.errorMessage.subscribe((notification: ErrorNotification) => {
      this.errorNotification = notification;
      this.doAnimate(TransitionDirection.In);
      setTimeout(() => {
        console.log('set timer');
        this.hide(notification);
      }, notification.duration);
    });

  }

  public async hide(notification: ErrorNotification) {
    // Check if message shown is one we want to be hidden
    if (this.errorNotification && notification.id === this.errorNotification.id) {
      console.log('Starting hide transition');
      this.doAnimate(TransitionDirection.Out, () => {
        this.errorNotification = undefined;
        console.log('Transition CB called');
      });
    } else {
      console.log('Not hiding');
    }
  }

  public doAnimate(direction: TransitionDirection, cb?: () => void) {
    const transitionDuration = this.transitionDuration;
    this.transitionController.animate(
      new Transition('fade up', transitionDuration, direction, cb)
    );
  }
}
