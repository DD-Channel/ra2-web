System.register(
    "gui/screen/mainMenu/modSel/BadModArchiveError",
    [],
    function (e, t) {
      "use strict";
      var i;
      t && t.id;
      return {
        setters: [],
        execute: function () {
          (i = class extends Error {}), e("BadModArchiveError", i);
        },
      };
    },
  ),
  