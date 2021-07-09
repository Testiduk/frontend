import type { ABTest } from '@guardian/ab-core';
import { puzzlesBanner } from 'common/modules/experiments/tests/puzzles-banner';
import { remoteRRHeaderLinksTest } from 'common/modules/experiments/tests/remote-header-test';
import { signInGateMainControl } from 'common/modules/experiments/tests/sign-in-gate-main-control';
import { signInGateMainVariant } from 'common/modules/experiments/tests/sign-in-gate-main-variant';
import { signInGateUsMandatory } from 'common/modules/experiments/tests/sign-in-gate-us-mandatory';
import { commercialPartner } from './tests/commercial-partner';

// keep in sync with ab-tests in dotcom-rendering
// https://github.com/guardian/dotcom-rendering/tree/main/src/web/experiments/ab-tests.ts
export const concurrentTests: readonly ABTest[] = [
	commercialPartner,
	signInGateMainVariant,
	signInGateMainControl,
	signInGateUsMandatory,
	puzzlesBanner,
	remoteRRHeaderLinksTest,
];
