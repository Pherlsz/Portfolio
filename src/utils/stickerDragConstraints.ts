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

export const ZERO_DRAG_CONSTRAINTS: AxisDragConstraints = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
};

/** Motion dragConstraints object from the lid `room()` offsets at drag start. */
export function roomToDragConstraints(space: RoomSpace): AxisDragConstraints {
  return {
    left: space.left,
    right: space.right,
    top: space.up,
    bottom: space.down
  };
}
