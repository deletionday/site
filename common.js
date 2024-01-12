/* This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You can find a copy of the GNU General Public License at
 * <https://www.gnu.org/licenses/>.
 * */

// Utils
// `q`: element query.
// `p`: optional parent element, or array of parent elements.
// `f`: function to run over each element.
// returns a flat array containing the results of `f`.
const $ = (q, p = [document]) => f => (p instanceof Element ? [p] : p).flatMap(e => Array.from(e.querySelectorAll(q)).map(f));
// accepts same args as `$` above. returns a single element, or an array of elements if there are multiple matches.
const $$ = (...args) => {
	const result = $(...args)(x => x);
	return result.length > 1 ? result : result[0];
};
const elWrap = (el, inner, className) => `<${el}${className ? ` class="${className}"` : ''}>${inner}</${el}>`;
// debouncer, with `add(fn)` and `trigger()` methods.
const resizeDebouncer = (() => {
	const fns = [];
	let timeout;
	return {
		add: fn => fns.push(fn),
		trigger: () => {
			clearTimeout(timeout);
			timeout = setTimeout(() => fns.forEach(fn => fn(), 100));
		},
	};
})();
window.addEventListener('resize', resizeDebouncer.trigger);

// attach hover links to headers.
$('h2, h3, h4', $$('main'))(el => {
	if (el.classList.contains('full-justify')) return;
	const a = document.createElement('a');
	a.setAttribute('aria-hidden', true);
	a.href = `#${el.id}`;
	a.className = 'header-link';
	a.textContent = el.textContent;
	a.innerHTML = '<svg viewBox="0 0 16 16" version="1.1" width="16" height="16" stroke="currentColor"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>';
	el.prepend(a);
});

// handle dynamic dates.
const updateDates = () => {
	const today = new Date();
	const year = today.getFullYear();
	const diff = new Date(year, 3, 4) - today;
	const isThisYear = diff > -86400000;
	const isLaterThisYear = diff > 0;
	const isToday = isThisYear && !isLaterThisYear;
	$('.next-date')(el => {
		if (isToday) {
			el.innerHTML = `${elWrap('span', 'Deletion Day', 'line')} ${elWrap('span', 'is <span class="wavy">today</span>!', 'line stretch')}`;
		} else  {
			el.innerHTML = `${elWrap('span', 'The next', 'line stretch')} ${elWrap('span', 'Deletion Day', 'line')}<br class="hard-break"> ${elWrap('span', 'is April 4<sup>th</sup>', 'line')} ${elWrap('span', `${isLaterThisYear ? year : year + 1}`.split('').map(n => elWrap('span', n)).join(''), 'word')}`;
		}
	});
	$('.copy-year')(el => el.textContent = year);
	const countdown = Math.ceil((isThisYear ? diff : new Date(year + 1, 3, 4) - today) / 86400000);
	$$('.countdown').innerHTML = `${(countdown)}<span class="cursor"></span> days until April 4<sup>th</sup>`;
	// re-run occasionally.
	window.setTimeout(updateDates, 1200000);
};
updateDates();

// handle header scaling and animation.
const header = $$('h1');
const htmlSnippet = `<span class="outer"><span class="inner"><span class="text">${header.textContent}</span><span class="cursor"></span></span></span>`;
header.innerHTML = `${htmlSnippet}${htmlSnippet}`;

const outers = $$('.outer', header);
const inners = $$('.inner', outers);
const texts = $$('.text', inners);
const scaleHeader = () => {
	header.classList.remove('show');
	inners[0].style.transform = 'none';

	const {height: h0, width: w0} = inners[0].getBoundingClientRect();
	const {height: h1, width: w1} = outers[0].getBoundingClientRect();
	const ratio = w1 / w0;

	outers.forEach(outer => outer.style.height = `${h0 * ratio}px`);
	inners.forEach(inner => inner.style.transform = `scale(${ratio})`);
	header.style.marginTop = `-${h0 * ratio / 1.5}px`;
	header.classList.add('show');
};
resizeDebouncer.add(scaleHeader);
scaleHeader();

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let animateHeaderTimeout;
function animateHeader() {
	if (reducedMotionQuery.matches) {
		document.body.classList.add('no-js-motion');
		clearTimeout(animateHeaderTimeout);
	} else {
		document.body.classList.remove('no-js-motion');
		animateHeaderTimeout = window.setTimeout(function animateHeader () {
			const {textContent} = texts[1];
			if (textContent.length) {
				texts[1].textContent = textContent.slice(0, -1);
				animateHeaderTimeout = window.setTimeout(animateHeader, 200 + Math.random() * 1400);
			} else {
				header.classList.add('deleted');
				animateHeaderTimeout = window.setTimeout(() => {
					header.classList.remove('deleted');
					texts[1].textContent = texts[0].textContent;
					animateHeaderTimeout = window.setTimeout(animateHeader, 200 + Math.random() * 1400);
				}, 200);
			}
		}, 200 + Math.random() * 1400);
	}
}
reducedMotionQuery.addEventListener('change', animateHeader);
animateHeader();
