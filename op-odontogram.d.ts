declare module "op-odontogram" {
  import type { ComponentType } from "react";

  export type OdontogramTooth = {
    id: number;
    status?: string;
    selected?: boolean;
    isSelected?: boolean;
    [key: string]: unknown;
  };

  export interface OdontogramProps {
    teeth: OdontogramTooth[];
    temporaryTeeth: OdontogramTooth[];
    showTemporaryTeeth: boolean;
    onToggleTemporaryTeeth: (value: boolean) => void;
    showDemoMode: boolean;
    onToggleDemoMode: (value: boolean) => void;
    selectedTooth: OdontogramTooth | null;
    onToothClick: (tooth: OdontogramTooth) => void;
    showBiteEffect: boolean;
    onToggleBiteEffect: (value: boolean) => void;
    isAnimatingBite: boolean;
    onSimulateBite: () => void;
  }

  export const Odontogram: ComponentType<OdontogramProps>;
  export const initialPermanentTeeth: OdontogramTooth[];
  export const initialTemporaryTeeth: OdontogramTooth[];
}
