export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dependencies: string[]; // IDs of nodes that must be completed first
  position: { x: number; y: number };
}

export interface Roadmap {
  id: string;
  title: string;
  description?: string;
  nodes: RoadmapNode[];
} 