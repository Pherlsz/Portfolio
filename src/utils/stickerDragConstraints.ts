export type RoomSpace = {
  left: number;
  right: number;
  up: number;
  down: number;
};

export type AxisDragConstraints = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type MotionOffset = {
  x: number;
  y: number;
};

export const ZERO_DRAG_CONSTRAINTS: AxisDragConstraints = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
};

/** Motion dragConstraints min/max for x/y, relative to the current motion offset. */
export function roomToDragConstraints(space: RoomSpace, offset: MotionOffset): AxisDragConstraints {
  return {
    left: offset.x + space.left,
    right: offset.x + space.right,
    top: offset.y + space.up,
    bottom: offset.y + space.down
  };
}
