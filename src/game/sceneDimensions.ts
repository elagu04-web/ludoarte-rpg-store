export interface SceneDimensions {
  width: number;
  height: number;
  /** Camera zoom while this scene is active. */
  zoom: number;
}

// Each room's background art has its own native size/orientation. The
// exterior stays at 1x so the whole building facade is visible at once;
// the interiors zoom in since they're taller than the viewport and benefit
// from a closer, scrolling camera.
export const SCENE_DIMENSIONS: Record<string, SceneDimensions> = {
  ExteriorScene: { width: 1536, height: 1024, zoom: 1 },
  GroundFloorScene: { width: 916, height: 1717, zoom: 1.5 },
  StoreScene: { width: 1024, height: 1536, zoom: 1.5 },
};
