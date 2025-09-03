import { IThing } from "./IThing"

export interface IWellScreen {
  id: number
  created_at: string
  release_status: string
  thing_id: number
  thing: IThing
  screen_depth_bottom: number
  screen_depth_top: number
  screen_type: string | null
  screen_description: string | null
}
