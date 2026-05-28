export type ApplicationJourneyStep = {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'failed';
};

export function buildStudentApplicationJourney(input: {
  applicationStatus: string;
  requirementStatus: string;
  currentStep: string | null;
  paymentCaptured: boolean;
}): ApplicationJourneyStep[] {
  const { applicationStatus, requirementStatus, currentStep, paymentCaptured } = input;

  const sent: ApplicationJourneyStep = { key: 'sent', label: 'Application sent', state: 'done' };

  if (applicationStatus === 'rejected') {
    return [
      sent,
      { key: 'review', label: 'Client reviewed', state: 'done' },
      { key: 'out', label: 'Not selected', state: 'failed' },
    ];
  }

  if (applicationStatus === 'withdrawn') {
    return [
      sent,
      { key: 'out', label: 'Withdrawn', state: 'failed' },
    ];
  }

  if (applicationStatus === 'pending') {
    return [
      sent,
      { key: 'review', label: 'Awaiting client review', state: 'current' },
      { key: 'matched', label: 'Matched with client', state: 'upcoming' },
      { key: 'working', label: 'Task in progress', state: 'upcoming' },
      { key: 'paid', label: 'Payment released', state: 'upcoming' },
    ];
  }

  const paidDone =
    paymentCaptured || currentStep === 'paid' || requirementStatus === 'completed';

  if (paidDone) {
    return [
      sent,
      { key: 'review', label: 'Client reviewed', state: 'done' },
      { key: 'matched', label: 'Matched with client', state: 'done' },
      { key: 'working', label: 'Task completed', state: 'done' },
      { key: 'task-review', label: 'Review passed', state: 'done' },
      { key: 'paid', label: 'Payment released', state: 'done' },
    ];
  }

  if (currentStep === 'review') {
    return [
      sent,
      { key: 'review', label: 'Client reviewed', state: 'done' },
      { key: 'matched', label: 'Matched with client', state: 'done' },
      { key: 'working', label: 'Work submitted', state: 'done' },
      { key: 'task-review', label: 'Under client review', state: 'current' },
      { key: 'paid', label: 'Payment released', state: 'upcoming' },
    ];
  }

  if (currentStep === 'working' || requirementStatus === 'in_progress') {
    return [
      sent,
      { key: 'review', label: 'Client reviewed', state: 'done' },
      { key: 'matched', label: 'Matched with client', state: 'done' },
      { key: 'working', label: 'Working on task', state: 'current' },
      { key: 'paid', label: 'Payment released', state: 'upcoming' },
    ];
  }

  return [
    sent,
    { key: 'review', label: 'Client reviewed', state: 'done' },
    { key: 'matched', label: 'Matched with client', state: 'done' },
    { key: 'working', label: 'Start task in chat', state: 'current' },
    { key: 'paid', label: 'Payment released', state: 'upcoming' },
  ];
}

export function applicationStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Awaiting review';
    case 'accepted':
      return 'Matched';
    case 'rejected':
      return 'Not selected';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return status;
  }
}
