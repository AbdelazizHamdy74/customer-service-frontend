import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-welcome.component.html',
  styleUrls: ['./customer-welcome.component.css'],
})
export class CustomerWelcomeComponent {
  private auth = inject(AuthService);
  customerName = signal('');

  constructor() {
    // Assume AuthService exposes currentUser as a signal or observable
    const user = this.auth.getCurrentUser();
    if (user && user.userType === 'CUSTOMER') {
      this.customerName.set(user.name || '');
    }
  }
}
