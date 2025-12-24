const searchParams = new URLSearchParams(window.location.search);
export const esmDevSuffix = searchParams.has("dev") ? "?dev" : "";
const reactModule = await import(`https://esm.sh/react@18${esmDevSuffix}`);
const htmModule = await import(`https://esm.sh/htm@3.1.1${esmDevSuffix}`);
const React = reactModule.default;
const htm = htmModule.default;

export const html = htm.bind(React.createElement);
export { React };
