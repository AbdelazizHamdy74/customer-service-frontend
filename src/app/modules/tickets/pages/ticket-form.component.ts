import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketUpsertPayload } from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Tickets workspace
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">Create new ticket</h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            Submit a new support ticket with customer details and issue description.
          </p>
        </div>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">Subject *</span>
              <input
                formControlName="subject"
                type="text"
                placeholder="Brief description of the issue"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">Customer ID *</span>
              <input
                formControlName="customerId"
                type="text"
                placeholder="Customer identifier"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>
          </div>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Description *</span>
            <textarea
              formControlName="description"
              rows="4"
              placeholder="Detailed description of the issue"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            ></textarea>
          </label>

          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="ticketForm.invalid || loading()"
              class="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create ticket
            </button>
            <button
              type="button"
              (click)="onCancel()"
              class="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class TicketFormComponent {
  private readonly ticketService = inject(TicketService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly ticketForm = this.formBuilder.group({
    subject: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    customerId: ['', Validators.required],
  });

  readonly loading = this.ticketService.usingMock();

  onSubmit(): void {
    if (this.ticketForm.valid) {
      const value = this.ticketForm.value;
      const payload: TicketUpsertPayload = {
        subject: value.subject!,
        description: value.description!,
        customerId: value.customerId!,
      };
      this.ticketService.create(payload).subscribe({
        next: () => {
          this.router.navigate(['/tickets']);
        },
        error: (error) => {
          console.error('Error creating ticket:', error);
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/tickets']);
  }
}
