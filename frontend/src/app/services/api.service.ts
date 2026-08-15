import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Resume } from '../models/resume.model';

export interface BulletRewriteResponse {
  variants: string[];
}

export interface SummaryResponse {
  summary: string;
}

export interface GapCheckResponse {
  gaps: string[];
  followUps: string[];
}

export interface HistoryMeta {
  id: string;
  savedAt: string;
  name: string;
}

export interface HistoryEntry extends HistoryMeta {
  resume: Resume;
}

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  rewriteBullet(bullet: string, roleContext: string): Observable<BulletRewriteResponse> {
    return this.http
      .post<BulletRewriteResponse>(`${API_BASE}/ai/rewrite-bullet`, { bullet, roleContext })
      .pipe(catchError(this.handle));
  }

  generateSummary(resume: Resume, targetRole?: string): Observable<SummaryResponse> {
    return this.http
      .post<SummaryResponse>(`${API_BASE}/ai/summary`, { resume, targetRole })
      .pipe(catchError(this.handle));
  }

  gapCheck(resume: Resume, jd?: string): Observable<GapCheckResponse> {
    return this.http
      .post<GapCheckResponse>(`${API_BASE}/ai/gap-check`, { resume, jd })
      .pipe(catchError(this.handle));
  }

  downloadPdf(resume: Resume): Observable<Blob> {
    return this.http
      .post(`${API_BASE}/pdf/generate`, { resume }, { responseType: 'blob' })
      .pipe(catchError(this.handle));
  }

  listHistory(): Observable<HistoryMeta[]> {
    return this.http.get<HistoryMeta[]>(`${API_BASE}/history`).pipe(catchError(this.handle));
  }

  loadHistory(id: string): Observable<HistoryEntry> {
    return this.http.get<HistoryEntry>(`${API_BASE}/history/${id}`).pipe(catchError(this.handle));
  }

  saveHistory(resume: Resume): Observable<HistoryMeta> {
    return this.http.post<HistoryMeta>(`${API_BASE}/history`, { resume }).pipe(catchError(this.handle));
  }

  private handle = (err: HttpErrorResponse) => {
    const msg = err.error?.message || err.message || 'Request failed.';
    return throwError(() => new Error(msg));
  };
}
