export interface ICategory {
  id: number;
  title: string;
}

export type IStatus = "published" | "draft" | "rejected";

export interface IPost {
  id: number;
  title: string;
  content: string;
  status: IStatus;
  category: ICategory;
}

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};


export interface ILocation {
  PointID: string;
  SiteID: string;
  PublicRelease: boolean;
  // title: string;
  // status: IStatus;
  // category: ICategory;
}

export interface IWell {
  PointID: string;
  OSEWellID: string;
  OSEWelltagID: string;
  formation: string;
  construction_notes: string
}