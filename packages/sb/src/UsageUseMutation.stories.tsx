import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import CytoscapeView from './CytoscapeView';
import elements from '../../../tmp/useMutationUsages.json';
import { Button } from './stories/Button';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Usages/useMutation',
  component: CytoscapeView,
  parameters: {
    layout: 'fullscreen'
  },
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Button>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof CytoscapeView> = args => <CytoscapeView {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  elements
};
