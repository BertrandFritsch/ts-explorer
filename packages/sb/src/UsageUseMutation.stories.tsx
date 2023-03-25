import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import CytoscapeView from './CytoscapeView';
import useMutationElements from '../../../tmp/useMutationUsages.json';
import useIbisApolloMutationElements from '../../../tmp/useIbisApolloMutationUsages.json';
import useQueryElements from '../../../tmp/useQueryUsages.json';
import useIbisApolloQueryElements from '../../../tmp/useIbisApolloQueryUsages.json';
import MultiSelectAutocompleteAsyncElements from '../../../tmp/MultiSelectAutocompleteAsync.json';
import MultiSelectAutocompleteAsyncPaginatedElements from '../../../tmp/MultiSelectAutocompleteAsyncPaginated.json';
import DefaultMessagesElements from '../../../tmp/DefaultMessages.json';
import apolloClientElements from '../../../tmp/apolloClientUsages.json';
import useMatomoElements from '../../../tmp/useMatomoUsages.json';
import axiosElements from '../../../tmp/axiosUsages.json';
import RESTCallsElements from '../../../tmp/RESTCallsUsages.json';
import MUITooltipElements from '../../../tmp/MUITooltip.json';
import tabFiltersUsages from '../../../tmp/tabFiltersUsages.json';
import alertsUsages from '../../../tmp/alertsUsages.json';

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
} as ComponentMeta<typeof CytoscapeView>;

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

export const MultiSelectAutocompleteAsync = Template.bind({});
MultiSelectAutocompleteAsync.args = {
  elements: MultiSelectAutocompleteAsyncElements
};

export const MultiSelectAutocompleteAsyncPaginated = Template.bind({});
MultiSelectAutocompleteAsyncPaginated.args = {
  elements: MultiSelectAutocompleteAsyncPaginatedElements
};

export const DefaultMessages = Template.bind({});
DefaultMessages.args = {
  elements: DefaultMessagesElements
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

export const MUITooltip = Template.bind({});
MUITooltip.args = {
  elements: MUITooltipElements
};

export const TabFiltersUsages = Template.bind({});
TabFiltersUsages.args = {
  elements: tabFiltersUsages
};

export const AlertsUsages = Template.bind({});
AlertsUsages.args = {
  elements: alertsUsages
};
