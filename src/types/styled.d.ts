// Tell styled-components that our DefaultTheme is react95's Theme shape.
// Without this, `theme.foo` inside template literals is `never` under
// strict TypeScript.

import "styled-components";
import type { Theme } from "react95/dist/themes/types";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
