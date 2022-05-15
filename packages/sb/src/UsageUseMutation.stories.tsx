import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import CytoscapeView from './CytoscapeView';
import useMutationElements from '../../../tmp/useMutationUsages.json';
import useIbisApolloMutationElements from '../../../tmp/useIbisApolloMutationUsages.json';
import useQueryElements from '../../../tmp/useQueryUsages.json';
import useIbisApolloQueryElements from '../../../tmp/useIbisApolloQueryUsages.json';
import apolloClientElements from '../../../tmp/apolloClientUsages.json';
import useMatomoElements from '../../../tmp/useMatomoUsages.json';
import axiosElements from '../../../tmp/axiosUsages.json';
import RESTCallsElements from '../../../tmp/RESTCallsUsages.json';
import { Button } from './stories/Button';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Usages',
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

export const useMutation = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
useMutation.args = {
  elements: useMutationElements
};

export const useIbisApolloMutation = Template.bind({});
useIbisApolloMutation.args = {
  elements: useIbisApolloMutationElements
};

export const useQuery = Template.bind({});
useQuery.args = {
  elements: useQueryElements
};

export const useIbisApolloQuery = Template.bind({});
useIbisApolloQuery.args = {
  elements: useIbisApolloQueryElements
};

export const apolloClient = Template.bind({});
apolloClient.args = {
  elements: apolloClientElements
};

export const useMatomo = Template.bind({});
useMatomo.args = {
  elements: useMatomoElements
};

export const useAxios = Template.bind({});
useAxios.args = {
  elements: axiosElements
};

export const RESTCalls = Template.bind({});
RESTCalls.args = {
  elements: RESTCallsElements
};
