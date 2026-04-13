import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  happenedAt: string;
  entityType?: string | null;
  entityId?: string | null;
  topic?: string;
}

type RawNotification = {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  happenedAt?: string;
  topic?: string;
  entity?: { entityType?: string; entityId?: string };
};

type ListData = {
  items?: RawNotification[];
  unreadCount?: number;
};

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private readonly http: HttpClient) {}

  list(params: { page?: number; limit?: number } = {}): Observable<{
    items: AppNotification[];
    unreadCount: number;
  }> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));

    return this.http.get<ApiResponse<ListData>>(this.apiUrl, { params: httpParams }).pipe(
      map((res) => {
        const data = res.data || {};
        const items = (data.items || []).map((n) => this.mapOne(n));
        return {
          items,
          unreadCount: data.unreadCount ?? items.filter((i) => !i.isRead).length,
        };
      }),
    );
  }

  markRead(id: string): Observable<void> {
    return this.http
      .patch<ApiResponse<unknown>>(`${this.apiUrl}/${id}/read`, {})
      .pipe(map(() => undefined));
  }

  private mapOne(n: RawNotification): AppNotification {
    return {
      id: String(n._id || n.id || ''),
      title: n.title || 'Notification',
      message: n.message || '',
      isRead: !!n.isRead,
      happenedAt: n.happenedAt || new Date().toISOString(),
      entityType: n.entity?.entityType || null,
      entityId: n.entity?.entityId || null,
      topic: n.topic,
    };
  }
}
