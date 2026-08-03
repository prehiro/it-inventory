// Mock the `server-only` package so scripts can import server actions (auth) outside Next.
const Module = require("module");
const orig = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  return orig.apply(this, arguments);
};
