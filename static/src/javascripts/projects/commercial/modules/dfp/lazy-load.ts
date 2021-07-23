import once from 'lodash/once';
import { dfpEnv } from './dfp-env';
import { getAdvertById } from './get-advert-by-id';
import { loadAdvert, refreshAdvert } from './load-advert';
import type { Advert } from './Advert';

const displayAd = (advertId: string) => {
	const advert = getAdvertById(advertId);
	if (advert) {
		if (advert.isRendered) {
			refreshAdvert(advert);
		} else {
			loadAdvert(advert);
		}
	}
};

const onIntersect = (
	entries: IntersectionObserverEntry[],
	observer: IntersectionObserver,
) => {
	const advertIds: string[] = [];

	entries
		.filter((entry) => !('isIntersecting' in entry) || entry.isIntersecting)
		.forEach((entry) => {
			observer.unobserve(entry.target);
			displayAd(entry.target.id);
			advertIds.push(entry.target.id);
		});

	dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter(
		(advert) => advertIds.indexOf(advert.id) < 0,
	);
};

const getObserver = once(() =>
	Promise.resolve(
		new window.IntersectionObserver(onIntersect, {
			rootMargin: '200px 0px',
		}),
	),
);

export const enableLazyLoad = (advert: Advert) => {
	if (dfpEnv.lazyLoadObserve) {
		getObserver().then((observer) => observer.observe(advert.node));
	} else {
		displayAd(advert.id);
	}
};
