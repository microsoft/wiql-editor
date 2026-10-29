// Source files use the global jQuery loaded by the host page.
const jquery = require("jquery");
(global as any).$ = jquery;
(global as any).jQuery = jquery;
