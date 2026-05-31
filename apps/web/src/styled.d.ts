import "styled-components";
import type { AppTheme } from "./app/theme";

declare module "styled-components" {
  export interface DefaultTheme {
    color: AppTheme["color"];
    font: AppTheme["font"];
    spacing: AppTheme["spacing"];
    radius: AppTheme["radius"];
    layout: AppTheme["layout"];
    breakpoint: AppTheme["breakpoint"];
  }
}
