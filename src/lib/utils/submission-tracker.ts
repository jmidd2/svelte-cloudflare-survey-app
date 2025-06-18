interface SubmissionRecord {
  formId: string;
  submittedAt: number;
  count: number;
}

interface SubmissionLimits {
  maxSubmissions: number;
  timeWindowMs: number; // Time window in milliseconds
}

export interface SubmissionInfo {
  totalSubmissions: number;
  remainingSubmissions: number;
  maxSubmissions: number;
  canSubmit: boolean;
  nextResetTime: number | null;
  timeWindowHours: number;
}

const DEFAULT_LIMITS: SubmissionLimits = {
  maxSubmissions: 3, // Max 3 submissions
  timeWindowMs: 24 * 60 * 60 * 1000, // 24 hours
};

class SubmissionTracker {
  private storageKey = 'form-submissions';

  private getStoredSubmissions(): SubmissionRecord[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveSubmissions(submissions: SubmissionRecord[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(submissions));
    } catch (error) {
      console.warn('Failed to save submission tracking:', error);
    }
  }

  private cleanExpiredSubmissions(
    submissions: SubmissionRecord[],
    timeWindowMs: number
  ): SubmissionRecord[] {
    const now = Date.now();
    return submissions.filter(sub => now - sub.submittedAt < timeWindowMs);
  }

  canSubmit(
    formId: string,
    limits: SubmissionLimits = DEFAULT_LIMITS
  ): boolean {
    const submissions = this.getStoredSubmissions();
    const cleanSubmissions = this.cleanExpiredSubmissions(
      submissions,
      limits.timeWindowMs
    );

    const formSubmissions = cleanSubmissions.filter(
      sub => sub.formId === formId
    );
    const totalSubmissions = formSubmissions.reduce(
      (sum, sub) => sum + sub.count,
      0
    );

    return totalSubmissions < limits.maxSubmissions;
  }

  getSubmissionInfo(
    formId: string,
    limits: SubmissionLimits = DEFAULT_LIMITS
  ): SubmissionInfo {
    const submissions = this.getStoredSubmissions();
    const cleanSubmissions = this.cleanExpiredSubmissions(
      submissions,
      limits.timeWindowMs
    );

    const formSubmissions = cleanSubmissions.filter(
      sub => sub.formId === formId
    );
    const totalSubmissions = formSubmissions.reduce(
      (sum, sub) => sum + sub.count,
      0
    );
    const remainingSubmissions = Math.max(
      0,
      limits.maxSubmissions - totalSubmissions
    );

    const nextResetTime =
      formSubmissions.length > 0
        ? Math.min(
            ...formSubmissions.map(sub => sub.submittedAt + limits.timeWindowMs)
          )
        : null;

    return {
      totalSubmissions,
      remainingSubmissions,
      maxSubmissions: limits.maxSubmissions,
      canSubmit: remainingSubmissions > 0,
      nextResetTime,
      timeWindowHours: limits.timeWindowMs / (60 * 60 * 1000),
    };
  }

  recordSubmission(formId: string): void {
    const submissions = this.getStoredSubmissions();
    const now = Date.now();

    // Find existing record for this form
    const existingIndex = submissions.findIndex(sub => sub.formId === formId);

    if (existingIndex >= 0) {
      submissions[existingIndex].count += 1;
      submissions[existingIndex].submittedAt = now;
    } else {
      submissions.push({
        formId,
        submittedAt: now,
        count: 1,
      });
    }

    this.saveSubmissions(submissions);
  }

  clearSubmissions(formId?: string): void {
    if (formId) {
      const submissions = this.getStoredSubmissions();
      const filtered = submissions.filter(sub => sub.formId !== formId);
      this.saveSubmissions(filtered);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    }
  }
}

export const submissionTracker = new SubmissionTracker();
export type { SubmissionLimits };
