/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAppContent } from '../context/AppContext';

export function useApp() {
  return useAppContent();
}
