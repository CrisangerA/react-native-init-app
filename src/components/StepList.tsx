import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "./Spinner.js";
import { Badge } from "./Badge.js";

interface StepListProps {
  steps: string[];
  currentStep: number;
}

export const StepList: React.FC<StepListProps> = ({ steps, currentStep }) => {
  return (
    <Box flexDirection="column">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        let icon = <Text color="gray">  ○ </Text>;
        let stepText = <Text color="gray">{step}</Text>;

        if (isComplete) {
          icon = <Text color="green">  ● </Text>;
          stepText = <Text color="green">{step}</Text>;
        } else if (isCurrent) {
          icon = (
            <Box marginRight={1}>
              <Spinner />
            </Box>
          );
          stepText = <Text color="yellow" bold>{step}</Text>;
        }

        return (
          <Box key={index} marginBottom={0}>
            {icon}
            {stepText}
            {isComplete && (
              <Box marginLeft={1}>
                <Badge label="DONE" variant="success" />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
