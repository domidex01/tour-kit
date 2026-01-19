import type { AnnouncementVariant, DismissalReason } from './announcement'

/**
 * Announcement analytics event types
 */
export type AnnouncementEventType =
  | 'announcement_registered'
  | 'announcement_shown'
  | 'announcement_dismissed'
  | 'announcement_completed'
  | 'announcement_action_clicked'
  | 'announcement_queued'
  | 'announcement_dequeued'

/**
 * Base announcement event
 */
export interface BaseAnnouncementEvent {
  type: AnnouncementEventType
  announcementId: string
  variant: AnnouncementVariant
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * Announcement registered event
 */
export interface AnnouncementRegisteredEvent extends BaseAnnouncementEvent {
  type: 'announcement_registered'
}

/**
 * Announcement shown event
 */
export interface AnnouncementShownEvent extends BaseAnnouncementEvent {
  type: 'announcement_shown'
  viewCount: number
  fromQueue: boolean
}

/**
 * Announcement dismissed event
 */
export interface AnnouncementDismissedEvent extends BaseAnnouncementEvent {
  type: 'announcement_dismissed'
  reason: DismissalReason
  viewDuration: number
}

/**
 * Announcement completed event
 */
export interface AnnouncementCompletedEvent extends BaseAnnouncementEvent {
  type: 'announcement_completed'
  viewDuration: number
}

/**
 * Announcement action clicked event
 */
export interface AnnouncementActionClickedEvent extends BaseAnnouncementEvent {
  type: 'announcement_action_clicked'
  actionType: 'primary' | 'secondary'
  actionLabel: string
}

/**
 * Announcement queued event
 */
export interface AnnouncementQueuedEvent extends BaseAnnouncementEvent {
  type: 'announcement_queued'
  queuePosition: number
}

/**
 * Announcement dequeued event
 */
export interface AnnouncementDequeuedEvent extends BaseAnnouncementEvent {
  type: 'announcement_dequeued'
  reason: 'shown' | 'expired' | 'removed'
}

/**
 * Union of all announcement events
 */
export type AnnouncementEvent =
  | AnnouncementRegisteredEvent
  | AnnouncementShownEvent
  | AnnouncementDismissedEvent
  | AnnouncementCompletedEvent
  | AnnouncementActionClickedEvent
  | AnnouncementQueuedEvent
  | AnnouncementDequeuedEvent
