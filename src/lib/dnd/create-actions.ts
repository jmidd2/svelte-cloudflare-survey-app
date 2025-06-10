import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import {
  type ElementDragPayload,
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';

export interface DragConfig<T = Record<string | symbol, unknown>> {
  getData: () => T;
  onDragStart?: () => void;
  onDrop?: () => void;
  onGenerateDragPreview?: (options: {
    container: HTMLElement;
    source?: ElementDragPayload;
  }) => void;
}

export interface DropConfig<T = Record<string | symbol, unknown>> {
  canDrop: (data: T) => boolean;
  onDragEnter?: (edge: Edge | null) => void;
  onDrag?: (edge: Edge | null) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  allowedEdges?: Edge[];
  getData: () => T;
}

interface Configs extends DragConfig, DropConfig {}

export function createDraggable<T extends Record<string | symbol, unknown>>(
  config: DragConfig<T>
) {
  return (element: HTMLElement | Element) => {
    return draggable({
      element: element as HTMLElement,
      getInitialData: config.getData,
      onGenerateDragPreview: config.onGenerateDragPreview
        ? ({ nativeSetDragImage, source }) => {
            setCustomNativeDragPreview({
              nativeSetDragImage,
              getOffset: pointerOutsideOfPreview({ x: '16px', y: '8px' }),
              render: ({ container }) =>
                config.onGenerateDragPreview?.({ container, source }),
            });
          }
        : undefined,
      onDragStart: config.onDragStart,
      onDrop: config.onDrop,
    });
  };
}

export function createDropTargetForElements<
  T extends Record<string | symbol, unknown>,
>(config: DropConfig<T>) {
  return (element: HTMLElement | Element) => {
    return dropTargetForElements({
      element,
      canDrop: ({ source }) =>
        source.element !== element && config.canDrop(source.data as T),
      getData: ({ input }) => {
        const data = config.getData();
        return attachClosestEdge(data, {
          element,
          input,
          allowedEdges: config.allowedEdges || ['top', 'bottom'],
        });
      },
      getIsSticky: () => true,
      onDragEnter: ({ self }) => {
        const edge = extractClosestEdge(self.data);
        config.onDragEnter?.(edge);
      },
      onDrag: ({ self }) => {
        const edge = extractClosestEdge(self.data);
        config.onDrag?.(edge);
      },
      onDragLeave: config.onDragLeave,
      onDrop: config.onDrop,
    });
  };
}

export function createActions(config: Configs) {
  return {
    createDraggable: createDraggable(config),
    createDropTargetForElements: createDropTargetForElements(config),
  } as const;
}
