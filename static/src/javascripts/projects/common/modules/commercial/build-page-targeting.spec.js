import {
    cmp as cmp_,
    onConsentChange,
} from '@guardian/consent-management-platform';
import { storage } from '@guardian/libs';
import config from '../../../../lib/config';
import { getCookie as getCookie_ } from '../../../../lib/cookies';
import {
    getBreakpoint as getBreakpoint_,
    getReferrer as getReferrer_,
    getViewport as getViewport_,
} from '../../../../lib/detect';
import { getCountryCode as getCountryCode_ } from '../../../../lib/geolocation';
import { getPrivacyFramework as getPrivacyFramework_ } from '../../../../lib/getPrivacyFramework';
import { getSynchronousParticipations as getSynchronousParticipations_ } from '../experiments/ab';
import { isUserLoggedIn as isUserLoggedIn_ } from '../identity/api';
import { getPageTargeting, _ } from './build-page-targeting';
import { commercialFeatures } from './commercial-features';
import { getUserSegments as getUserSegments_ } from './user-ad-targeting';

const getCookie = getCookie_;
const getUserSegments = getUserSegments_;
const getSynchronousParticipations = getSynchronousParticipations_;
const getReferrer = getReferrer_;
const getBreakpoint = getBreakpoint_;
const getViewport = getViewport_;
const isUserLoggedIn = isUserLoggedIn_;
const getCountryCode = getCountryCode_;
const getPrivacyFramework = getPrivacyFramework_;
const cmp = cmp_;

jest.mock('../../../../lib/config');
jest.mock('../../../../lib/cookies', () => ({
    getCookie: jest.fn(),
}));
jest.mock('../../../../lib/detect', () => ({
    getViewport: jest.fn(),
    getBreakpoint: jest.fn(),
    getReferrer: jest.fn(),
    hasPushStateSupport: jest.fn(),
}));
jest.mock('../../../../lib/geolocation', () => ({
    getCountryCode: jest.fn(),
}));
jest.mock('../../../../lib/getPrivacyFramework', () => ({
    getPrivacyFramework: jest.fn(),
}));
jest.mock('../identity/api', () => ({
    isUserLoggedIn: jest.fn(),
}));
jest.mock('./user-ad-targeting', () => ({
    getUserSegments: jest.fn(),
}));
jest.mock('../experiments/ab', () => ({
    getSynchronousParticipations: jest.fn(),
}));
jest.mock('lodash/once', () => fn => fn);
jest.mock('./commercial-features', () => ({
    commercialFeatures() {},
}));
jest.mock('@guardian/consent-management-platform', () => ({
    onConsentChange: jest.fn(),
    cmp: {
        hasInitialised: jest.fn(),
        willShowPrivacyMessageSync: jest.fn(),
    },
}));

// TCFv1
const tcfWithConsentMock = (callback) =>
    callback({ '1': true, '2': true, '3': true, '4': true, '5': true });
const tcfMixedConsentMock = (callback) =>
    callback({
        '1': false,
        '2': true,
        '3': true,
        '4': false,
        '5': true,
    });

// CCPA
const ccpaWithConsentMock = (callback) =>
    callback({ ccpa: { doNotSell: false } });
const ccpaWithoutConsentMock = (callback) =>
    callback({ ccpa: { doNotSell: true } });

// TCFv2
const tcfv2WithConsentMock = (callback) =>
    callback({
        tcfv2: {
            consents: { '1': true, '2': true },
            eventStatus: 'useractioncomplete',
        },
    });
const tcfv2WithoutConsentMock = (callback) =>
    callback({ tcfv2: { consents: {}, eventStatus: 'cmpuishown' } });
const tcfv2NullConsentMock = (callback) => callback({ tcfv2: {} });
const tcfv2MixedConsentMock = (callback) =>
    callback({
        tcfv2: {
            consents: { '1': false, '2': true },
            eventStatus: 'useractioncomplete',
        },
    });

describe('Build Page Targeting', () => {
    beforeEach(() => {
        config.page = {
            authorIds: 'profile/gabrielle-chan',
            blogIds: 'a/blog',
            contentType: 'Video',
            edition: 'US',
            keywordIds:
                'uk-news/prince-charles-letters,uk/uk,uk/prince-charles',
            pageId: 'football/series/footballweekly',
            publication: 'The Observer',
            seriesId: 'film/series/filmweekly',
            source: 'ITN',
            sponsorshipType: 'advertisement-features',
            tones: 'News',
            videoDuration: 63,
            sharedAdTargeting: {
                bl: ['blog'],
                br: 'p',
                co: ['gabrielle-chan'],
                ct: 'video',
                edition: 'us',
                k: ['prince-charles-letters', 'uk/uk', 'prince-charles'],
                ob: 't',
                p: 'ng',
                se: ['filmweekly'],
                su: ['5'],
                tn: ['news'],
                url: '/football/series/footballweekly',
            },
            isSensitive: false,
        };
        config.ophan = { pageViewId: 'presetOphanPageViewId' };

        commercialFeatures.adFree = false;

        // Reset mocking to default values.
        getCookie.mockReturnValue('ng101');
        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2NullConsentMock);

        getBreakpoint.mockReturnValue('mobile');
        getReferrer.mockReturnValue('');

        isUserLoggedIn.mockReturnValue(true);

        getUserSegments.mockReturnValue(['seg1', 'seg2']);

        getSynchronousParticipations.mockReturnValue({
            MtMaster: {
                variant: 'variantName',
            },
        });

        storage.local.setRaw('gu.alreadyVisited', 0);

        getCountryCode.mockReturnValue('US');
        getPrivacyFramework.mockReturnValue({ ccpa: true });

        jest.spyOn(global.Math, 'random').mockReturnValue(0.5);

        expect.hasAssertions();
    });

    afterEach(() => {
        jest.spyOn(global.Math, 'random').mockRestore();
        jest.resetAllMocks();
    });

    it('should exist', () => {
        expect(getPageTargeting).toBeDefined();
    });

    it('should build correct page targeting', () => {
        const pageTargeting = getPageTargeting();

        expect(pageTargeting.sens).toBe('f');
        expect(pageTargeting.edition).toBe('us');
        expect(pageTargeting.ct).toBe('video');
        expect(pageTargeting.p).toBe('ng');
        expect(pageTargeting.su).toEqual(['5']);
        expect(pageTargeting.bp).toBe('mobile');
        expect(pageTargeting.at).toBe('ng101');
        expect(pageTargeting.si).toEqual('t');
        expect(pageTargeting.gdncrm).toEqual(['seg1', 'seg2']);
        expect(pageTargeting.co).toEqual(['gabrielle-chan']);
        expect(pageTargeting.bl).toEqual(['blog']);
        expect(pageTargeting.ms).toBe('itn');
        expect(pageTargeting.tn).toEqual(['news']);
        expect(pageTargeting.vl).toEqual('90');
        expect(pageTargeting.pv).toEqual('presetOphanPageViewId');
        expect(pageTargeting.pa).toEqual('f');
        expect(pageTargeting.cc).toEqual('US');
        expect(pageTargeting.rp).toEqual('dotcom-platform');
    });

    it('should set correct personalized ad (pa) param', () => {
        onConsentChange.mockImplementation(tcfv2WithConsentMock);
        expect(getPageTargeting().pa).toBe('t');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2WithoutConsentMock);
        expect(getPageTargeting().pa).toBe('f');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2NullConsentMock);
        expect(getPageTargeting().pa).toBe('f');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2MixedConsentMock);
        expect(getPageTargeting().pa).toBe('f');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(ccpaWithConsentMock);
        expect(getPageTargeting().pa).toBe('t');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(ccpaWithoutConsentMock);
        expect(getPageTargeting().pa).toBe('f');
    });

    it('Should correctly set the RDP flag (rdp) param', () => {
        onConsentChange.mockImplementation(tcfWithConsentMock);
        expect(getPageTargeting().rdp).toBe('na');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2WithoutConsentMock);
        expect(getPageTargeting().rdp).toBe('na');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2NullConsentMock);
        expect(getPageTargeting().rdp).toBe('na');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfMixedConsentMock);
        expect(getPageTargeting().rdp).toBe('na');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(ccpaWithConsentMock);
        expect(getPageTargeting().rdp).toBe('f');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(ccpaWithoutConsentMock);
        expect(getPageTargeting().rdp).toBe('t');
    });

    it('Should correctly set the TCFv2 (consent_tcfv2, cmp_interaction) params', () => {
        _.resetPageTargeting();
        getPrivacyFramework.mockReturnValue({ tcfv2: true });

        onConsentChange.mockImplementation(tcfv2WithConsentMock);

        expect(getPageTargeting().consent_tcfv2).toBe('t');
        expect(getPageTargeting().cmp_interaction).toBe('useractioncomplete');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2WithoutConsentMock);

        expect(getPageTargeting().consent_tcfv2).toBe('f');
        expect(getPageTargeting().cmp_interaction).toBe('cmpuishown');

        _.resetPageTargeting();
        onConsentChange.mockImplementation(tcfv2MixedConsentMock);

        expect(getPageTargeting().consent_tcfv2).toBe('f');
        expect(getPageTargeting().cmp_interaction).toBe('useractioncomplete');

        _.resetPageTargeting();
        getPrivacyFramework.mockReturnValue({ tcfv1: true });
        onConsentChange.mockImplementation(tcfWithConsentMock);

        expect(getPageTargeting().consent_tcfv2).toBe('na');
        expect(getPageTargeting().cmp_interaction).toBe('na');
    });

    it('should set correct edition param', () => {
        expect(getPageTargeting().edition).toBe('us');
    });

    it('should set correct se param', () => {
        expect(getPageTargeting().se).toEqual(['filmweekly']);
    });

    it('should set correct k param', () => {
        expect(getPageTargeting().k).toEqual([
            'prince-charles-letters',
            'uk/uk',
            'prince-charles',
        ]);
    });

    it('should set correct ab param', () => {
        expect(getPageTargeting().ab).toEqual(['MtMaster-variantName']);
    });

    it('should set Observer flag for Observer content', () => {
        expect(getPageTargeting().ob).toEqual('t');
    });

    it('should set correct branding param for paid content', () => {
        expect(getPageTargeting().br).toEqual('p');
    });

    it('should not contain an ad-free targeting value', () => {
        expect(getPageTargeting().af).toBeUndefined();
    });

    it('should remove empty values', () => {
        config.page = {};
        config.ophan = { pageViewId: '123456' };
        getUserSegments.mockReturnValue([]);

        expect(getPageTargeting()).toEqual({
            sens: 'f',
            bp: 'mobile',
            at: 'ng101',
            si: 't',
            skinsize: 's',
            ab: ['MtMaster-variantName'],
            pv: '123456',
            fr: '0',
            inskin: 'f',
            pa: 'f',
            cc: 'US',
            rp: 'dotcom-platform',
            dcre: 'f',
            rdp: 'na',
            consent_tcfv2: 'na',
            cmp_interaction: 'na',
            amtgrp: '7',
        });
    });

    describe('Breakpoint targeting', () => {
        it('should set correct breakpoint targeting for a mobile device', () => {
            getBreakpoint.mockReturnValue('mobile');
            expect(getPageTargeting().bp).toEqual('mobile');
        });

        it('should set correct breakpoint targeting for a medium mobile device', () => {
            getBreakpoint.mockReturnValue('mobileMedium');
            expect(getPageTargeting().bp).toEqual('mobile');
        });

        it('should set correct breakpoint targeting for a mobile device in landscape mode', () => {
            getBreakpoint.mockReturnValue('mobileLandscape');
            expect(getPageTargeting().bp).toEqual('mobile');
        });

        it('should set correct breakpoint targeting for a phablet device', () => {
            getBreakpoint.mockReturnValue('phablet');
            expect(getPageTargeting().bp).toEqual('tablet');
        });

        it('should set correct breakpoint targeting for a tablet device', () => {
            getBreakpoint.mockReturnValue('tablet');
            expect(getPageTargeting().bp).toEqual('tablet');
        });

        it('should set correct breakpoint targeting for a desktop device', () => {
            getBreakpoint.mockReturnValue('desktop');
            expect(getPageTargeting().bp).toEqual('desktop');
        });

        it('should set correct breakpoint targeting for a leftCol device', () => {
            getBreakpoint.mockReturnValue('leftCol');
            expect(getPageTargeting().bp).toEqual('desktop');
        });

        it('should set correct breakpoint targeting for a wide device', () => {
            getBreakpoint.mockReturnValue('wide');
            expect(getPageTargeting().bp).toEqual('desktop');
        });


        it('should set appNexusPageTargeting as flatten string', () => {
            getBreakpoint.mockReturnValue('desktop');
            getPageTargeting();
            expect(config.get('page').appNexusPageTargeting).toEqual(
                "sens=f,pt1=/football/series/footballweekly,pt2=us,pt3=video,pt4=ng,pt5=prince-charles-letters,pt5=uk/uk,pt5=prince-charles,pt6=5,pt7=desktop,pt9=seg1,seg2|presetOphanPageViewId|gabrielle-chan|news|"
            );
        });
    });

    describe('Build Page Targeting (ad-free)', () => {
        it('should set the ad-free param to t when enabled', () => {
            commercialFeatures.adFree = true;
            expect(getPageTargeting().af).toBe('t');
        });
    });

    describe('Already visited frequency', () => {
        it('can pass a value of five or less', () => {
            storage.local.setRaw('gu.alreadyVisited', 5);
            expect(getPageTargeting().fr).toEqual('5');
        });

        it('between five and thirty, includes it in a bucket in the form "x-y"', () => {
            storage.local.setRaw('gu.alreadyVisited', 18);
            expect(getPageTargeting().fr).toEqual('16-19');
        });

        it('over thirty, includes it in the bucket "30plus"', () => {
            storage.local.setRaw('gu.alreadyVisited', 300);
            expect(getPageTargeting().fr).toEqual('30plus');
        });

        it('passes a value of 0 if the value is not stored', () => {
            storage.local.remove('gu.alreadyVisited');
            expect(getPageTargeting().fr).toEqual('0');
        });
    });

    describe('Referrer', () => {
        it('should set ref to Facebook', () => {
            getReferrer.mockReturnValue(
                'https://www.facebook.com/feel-the-force'
            );
            expect(getPageTargeting().ref).toEqual('facebook');
        });

        it('should set ref to Twitter', () => {
            getReferrer.mockReturnValue(
                'https://www.t.co/you-must-unlearn-what-you-have-learned'
            );
            expect(getPageTargeting().ref).toEqual('twitter');
        });

        it('should set ref to reddit', () => {
            getReferrer.mockReturnValue(
                'https://www.reddit.com/its-not-my-fault'
            );
            expect(getPageTargeting().ref).toEqual('reddit');
        });

        it('should set ref to google', () => {
            getReferrer.mockReturnValue(
                'https://www.google.com/i-find-your-lack-of-faith-distrubing'
            );
            expect(getPageTargeting().ref).toEqual('google');
        });

        it('should set ref empty string if referrer does not match', () => {
            getReferrer.mockReturnValue('https://theguardian.com');
            expect(getPageTargeting().ref).toEqual(undefined);
        });
    });

    describe('URL Keywords', () => {
        it('should return correct keywords from pageId', () => {
            expect(getPageTargeting().urlkw).toEqual(['footballweekly']);
        });

        it('should extract multiple url keywords correctly', () => {
            config.page.pageId =
                'stage/2016/jul/26/harry-potter-cursed-child-review-palace-theatre-london';
            expect(getPageTargeting().urlkw).toEqual([
                'harry',
                'potter',
                'cursed',
                'child',
                'review',
                'palace',
                'theatre',
                'london',
            ]);
        });

        it('should get correct keywords when trailing slash is present', () => {
            config.page.pageId =
                'stage/2016/jul/26/harry-potter-cursed-child-review-palace-theatre-london/';
            expect(getPageTargeting().urlkw).toEqual([
                'harry',
                'potter',
                'cursed',
                'child',
                'review',
                'palace',
                'theatre',
                'london',
            ]);
        });
    });

    describe('inskin targetting', () => {
        it('should not allow inskin if cmp has not initialised', () => {
            cmp.hasInitialised.mockReturnValue(false);
            cmp.willShowPrivacyMessageSync.mockReturnValue(false);
            getViewport.mockReturnValue({ width: 1920, height: 1080 });
            expect(getPageTargeting().inskin).toBe('f');
        });

        it('should not allow inskin if cmp will show a banner', () => {
            cmp.hasInitialised.mockReturnValue(true);
            cmp.willShowPrivacyMessageSync.mockReturnValue(true);
            getViewport.mockReturnValue({ width: 1920, height: 1080 });
            expect(getPageTargeting().inskin).toBe('f');
        });
    });

    describe('skinsize targetting', () => {
        it.each([
            ['s', 1280],
            ['s', 1440],
            ['s', 1559],
            ['l', 1560],
            ['l', 1561],
            ['l', 1920],
            ['l', 2560],
        ])("should return '%s' if viewport width is %s", (expected, width) => {
            cmp.hasInitialised.mockReturnValue(true);
            cmp.willShowPrivacyMessageSync.mockReturnValue(false);
            getViewport.mockReturnValue({ width, height: 800 });
            expect(getPageTargeting().skinsize).toBe(expected);
        });

        it("should return 's' if vp does not have a width", () => {
            getViewport.mockReturnValue(undefined);
            expect(getPageTargeting().skinsize).toBe('s');
        });
    });

    describe('ad manager group value', () => {
        const STORAGE_KEY = 'gu.adManagerGroup';
        it('if present in localstorage, use value from storage', () => {
            storage.local.setRaw(STORAGE_KEY, '10');
            expect(getPageTargeting().amtgrp).toEqual('10');
            storage.local.remove(STORAGE_KEY);
        });
        it('if not present in localstorage, generate a random group 1-12, store in localstorage', () => {
            // restore Math.random for this test so we can assert the group value range is 1-12
            jest.spyOn(global.Math, 'random').mockRestore();
            const valueGenerated = getPageTargeting().amtgrp;
            expect(Number(valueGenerated)).toBeGreaterThanOrEqual(1);
            expect(Number(valueGenerated)).toBeLessThanOrEqual(12);
            const valueFromStorage = storage.local.getRaw(STORAGE_KEY);
            expect(valueFromStorage).toEqual(valueGenerated);
        });
    });
});
