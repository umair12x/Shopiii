import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Shared icon wrapper to keep icon usage consistent across the app.
 */
export const AppIcon = ({ name = 'help-circle-outline', ...props }) => {
  return <MaterialCommunityIcons name={name} {...props} />;
};

export default AppIcon;
