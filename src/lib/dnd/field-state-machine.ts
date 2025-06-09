import type { FieldState } from '$lib/dnd/field-state-manager.svelte';
import { FiniteStateMachine } from 'runed';

type ACTIONS =
  | 'START_DRAG'
  | 'ENTER_DROP_ZONE'
  | 'LEAVE_DROP_ZONE'
  | 'DROP'
  | 'CANCEL'
  | 'UPDATE_EDGE'
  | 'GENERATE_PREVIEW';

// Define the state machine configuration
export const createFieldStateMachine = () =>
  new FiniteStateMachine<FieldState, ACTIONS>('idle', {
    idle: {
      START_DRAG: 'dragging',
      ENTER_DROP_ZONE: 'draggingOver',
      GENERATE_PREVIEW: 'preview',
      UPDATE_EDGE: 'draggingOver',
    },
    dragging: {
      ENTER_DROP_ZONE: 'draggingOver',
      DROP: 'idle',
      CANCEL: 'idle',
      GENERATE_PREVIEW: 'preview',
      UPDATE_EDGE: 'draggingOver',
    },
    preview: {
      START_DRAG: 'dragging',
      DROP: 'idle',
      CANCEL: 'idle',
    },
    draggingOver: {
      LEAVE_DROP_ZONE: 'idle',
      DROP: 'idle',
      UPDATE_EDGE: 'draggingOver',
      CANCEL: 'idle',
    },
  });

export type FieldStateMachine = ReturnType<typeof createFieldStateMachine>;
