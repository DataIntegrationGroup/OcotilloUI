import { IStatus, ICategory } from "@/interfaces";

export interface IPost {
  id: number;
  title: string;
  content: string;
  status: IStatus;
  category: ICategory;
}
