export interface SceneDimensions {
  width: number;
  height: number;
}

// Each room's background art has its own native size/orientation now, so
// the whole game canvas resizes per scene instead of using one fixed shape.
export const SCENE_DIMENSIONS: Record<string, SceneDimensions> = {
  ExteriorScene: { width: 1536, height: 1024 },
  GroundFloorScene: { width: 916, height: 1717 },
  StoreScene: { width: 1024, height: 1536 },
};
