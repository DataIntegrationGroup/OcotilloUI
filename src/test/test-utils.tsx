import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { TestProviders } from "./test-provider";

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ) => render(ui, { wrapper: TestProviders, ...options })
  
export { customRender as render }