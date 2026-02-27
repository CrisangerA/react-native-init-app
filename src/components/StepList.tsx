import React from "react";
import { Box, Text } from "ink";

interface StepListProps {
  steps: string[];
  currentStep: number;
}

export const StepList: React.FC<StepListProps> = ({ steps, currentStep }) => {
  return (
    <Box flexDirection="column" gap={0}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <Box key={index}>
            <Text color="gray">
              {isComplete ? "✓" : isCurrent ? "→" : " "} {step}
            </Text>
            {isComplete && <Text color="green"> ✓</Text>}
            {isCurrent && <Text color="yellow"> (in progress...)</Text>}
          </Box>
        );
      })}
    </Box>
  );
};
