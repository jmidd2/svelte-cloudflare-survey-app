import { createFieldStateMachine } from '$lib/dnd/field-state-machine';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { getContext, setContext } from 'svelte';

export class FieldStateManager {
  private machine = createFieldStateMachine();
  private previewContainer: HTMLElement | null = $state(null);
  private targetClosestEdge: Edge | null = $state(null);

  get currentState() {
    return this.machine.current;
  }

  // Convenient getters for specific context values
  get container() {
    return this.previewContainer;
  }

  get closestEdge() {
    return this.targetClosestEdge;
  }

  // State checking helpers
  get isIdle() {
    return this.currentState === 'idle';
  }

  get isDragging() {
    return this.currentState === 'dragging';
  }

  get isPreview() {
    return this.currentState === 'preview';
  }

  get isDraggingOver() {
    return this.currentState === 'draggingOver';
  }

  // Action methods
  startDrag() {
    this.machine.send('START_DRAG');
  }

  generatePreview(container: HTMLElement) {
    this.previewContainer = container;
    this.machine.send('GENERATE_PREVIEW', container);
  }

  enterDropZone(closestEdge: Edge | null) {
    this.targetClosestEdge = closestEdge;
    this.machine.send('ENTER_DROP_ZONE', closestEdge);
  }

  updateEdge(closestEdge: Edge | null) {
    this.targetClosestEdge = closestEdge;
    this.machine.send('UPDATE_EDGE', closestEdge);
  }

  leaveDropZone() {
    this.machine.send('LEAVE_DROP_ZONE');
  }

  drop() {
    this.machine.send('DROP');
  }

  cancel() {
    this.machine.send('CANCEL');
  }
}

const FIELD_STATE_MANAGER_KEY = Symbol('field-state-manager');
export function setFieldStateManager(manager: FieldStateManager) {
  return setContext(FIELD_STATE_MANAGER_KEY, manager);
}

export function getFieldStateManager(): FieldStateManager {
  const manager = getContext<FieldStateManager>(FIELD_STATE_MANAGER_KEY);
  if (!manager) {
    throw new Error(
      'FieldStateManager not found in context. Make sure to call setFieldStateManager in a parent component.'
    );
  }
  return manager;
}

export type FieldState = 'idle' | 'dragging' | 'preview' | 'draggingOver';
