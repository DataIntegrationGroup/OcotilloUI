import { IPrincipalInvestigator } from "@/interfaces/geochronology";

export interface IProject {
  id: number;
  name: string;
  principal_investigator: IPrincipalInvestigator;
}
