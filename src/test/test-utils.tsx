import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { TestProviders } from "./test-provider";

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ) => render(ui, { wrapper: TestProviders, ...options })
  
export * from '@testing-library/react'
export { customRender as render }