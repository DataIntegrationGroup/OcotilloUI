import { IProject, IMaterial } from "@/interfaces/geochronology";

export interface ISample {
  id: number;
  name: string;
  project: IProject;
  material: IMaterial;
  latitude: number;
  longitude: number;
}
